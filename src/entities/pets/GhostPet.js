import { world } from "../../world/world.js";
import { cameraX, cameraY, assets } from "../../core/braw.js";
import { CONFIG } from "../../core/config.js";

export class GhostPet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        
        // Характеристики
        this.hp = 5;
        this.maxHp = 5;
        this.isTamed = false;
        this.hasBubble = false;
        this.isBubblePermanent = false;
        // Таймеры и кулдауны
        this.attackCooldown = 0; // 1 урон в 3 секунды (180 кадров)
        this.waterDamageTimer = 0;
        
        // Движение
        this.vx = 0;
        this.vy = 0;
        this.speed = 2;
        this.catchUpSpeed = 7; // Скорость, если игрок убежал далеко
        
        // Состояния
        this.state = 'idle'; // idle, following, attacking, avoiding_water, 
        this.targetMob = null;
        this.targetBubbleItem = null;
        this.wanderTimer = 0;
    }
startTaming(item) {
    this.state = "taming";
    this.targetBubbleItem = item;
    item.isBeingConsumed = true;
    console.log("Призрак заметил жезл! Начинаем приручение");
}

startBubbleEquip(item) {
    this.state = "pet_bubble";
    this.targetBubbleItem = item;
    item.isBeingConsumed = true;
    console.log("Призрак заметил пузырь! Летим надеть");
}
    tame() {
        this.isTamed = true;
        this.hp = this.maxHp; // Восстанавливаем хп при приручении
        console.log("Призрак приручен!");
    }

    equipBubble() {
        this.hasBubble = true;
        this.state = 'following';
        console.log("Призрак надел пузырь и больше не боится воды!");
    }

update(dt, player, mobs, droppedItems) {
    if (this.hp <= 0) return;

    // 1. ПОИСК ПРЕДМЕТОВ (если призрак ничем не занят)
    if (this.state === 'idle' || this.state === 'following') {
        for (let item of droppedItems) {
            if (item.isBeingConsumed || item.pickedUp) continue;

            const dx = item.x - this.x;
            const dy = item.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            // ЛОГ-ДЕТЕКТОР: Сработает, если любой предмет в радиусе 150 пикселей
            if (dist < 150) {
                console.log(`[GHOST] Вижу рядом предмет: "${item.itemData.id}", Дистанция: ${dist.toFixed(0)}`);
            }

            if (dist < 250) {
                // Проверяем ID жезла
                if (!this.isTamed && item.itemData.id === "taming_staff") {
                    this.startTaming(item);
                    break;
                }
                // Проверяем ID пузыря
                if (this.isTamed && !this.hasBubble && item.itemData.id === "pet_bubble") {
                    this.startBubbleEquip(item);
                    break;
                }
            }
        }
    }

    // 2. ЛОГИКА ПОЛЕТА К ПРЕДМЕТУ
    if ((this.state === "taming" || this.state === "pet_bubble") && this.targetBubbleItem) {
        const item = this.targetBubbleItem;
        
        const dx = item.x - this.x;
        const dy = (item.y - 20) - this.y; 
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.x += (dx / dist) * 3; 
        this.y += (dy / dist) * 3;

        // Когда предмет взлетел достаточно высоко (60 кадров = 1 сек)
        if (item.floatTimer > 60 && dist < 20) {
            console.log("%c[GHOST] ПРЕДМЕТ ПОГЛОЩЕН!", "color: yellow; font-weight: bold;");
            if (this.state === "taming") {
                this.isTamed = true;
            } else {
                this.hasBubble = true;
                this.isBubblePermanent = true; // Добавь это! Теперь пузырь "внутри" призрака
            }
            this.showFlash = true;
            this.state = "following";
            item.pickedUp = true; // Это заставит main.js удалить предмет
            this.targetBubbleItem = null;
        }
        return; // Пока приручаемся, не выполняем остальную логику
    }
        // Кулдауны
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.waterDamageTimer > 0) this.waterDamageTimer--;

        // 1. ЛОГИКА ВОДЫ (Самое важное)
        const waterData = world.getWaterData(this.x);
        
        // Получение урона от воды (если коснулся и нет пузыря)
        if (waterData.isWater && !this.hasBubble) {
            // Если призрак опустился ниже уровня воды
            if (this.y + this.height > waterData.level) {
                if (this.waterDamageTimer <= 0) {
                    this.hp -= 1;
                    this.waterDamageTimer = 60; // 1 секунда неуязвимости от воды
                    this.vy = -5; // Отпрыгивает от воды вверх
                }
            }
        }

        if (!this.isTamed) {
            // Дикий призрак просто немного витает на месте
            this.y += Math.sin(Date.now() / 300) * 0.5;
            return;
        }

// === ЛОГИКА ПРИРУЧЕНИЯ И ПУЗЫРЯ (ОБНОВЛЕННАЯ) ===
if ((this.state === "taming" || this.state === "pet_bubble") && this.targetBubbleItem) {
    const item = this.targetBubbleItem;
    
    // Призрак летит не в точку на земле, а чуть выше предмета (так красивее)
    const dx = item.x - this.x;
    const dy = (item.y - 20) - this.y; 
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
        this.x += (dx / dist) * 3; 
        this.y += (dy / dist) * 3;
    }

    // Если предмет поднялся достаточно высоко (через floatTimer в DroppedItem)
    if (item.floatTimer > 60 && dist < 15) {
        if (this.state === "taming") {
            this.isTamed = true;
            this.showFlash = true; // Триггер вспышки для draw
            console.log("✨ Вспышка! Призрак приручен!");
        } else {
            this.hasBubble = true;
            this.showFlash = true;
            console.log("🫧 Вспышка! Пузырь надет!");
        }
        
        this.state = "following";
        item.pickedUp = true; // Удаляем предмет
        this.targetBubbleItem = null;
    }
    return; // Пока приручаемся, другую логику не выполняем
}

        const distToPlayerX = player.x - this.x;
        const distToPlayerY = player.y - this.y;
        const distToPlayer = Math.sqrt(distToPlayerX**2 + distToPlayerY**2);

        // 2. БОЯЗНЬ ВОДЫ (Облет)
        if (waterData.isWater && !this.hasBubble) {
            this.state = 'avoiding_water';
            const safeY = waterData.level - 100; // Держимся высоко над озером
            
            // Летим к игроку по X, но по Y держимся выше воды
            this.x += Math.sign(distToPlayerX) * this.speed;
            if (this.y > safeY) {
                this.y -= this.speed; // Летим вверх
            } else if (this.y < safeY - 20) {
                this.y += this.speed * 0.5;
            }
            return; // Прерываем обычную логику
        }
        
        // 3. ДОГОНЯЛКИ (Если игрок ушел далеко)
        if (distToPlayer > 400) {
            this.state = 'following';
            this.targetMob = null; // Бросаем врага, если игрок далеко
            this.x += (distToPlayerX / distToPlayer) * this.catchUpSpeed;
            this.y += (distToPlayerY / distToPlayer) * this.catchUpSpeed;
            return;
        }

        // 4. ПОИСК ВРАГОВ И АТАКА
        if (!this.targetMob || this.targetMob.isDead || this.targetMob.markedForDeletion) {
            this.targetMob = null;
            this.state = 'following';
            
            // Ищем ближайшего врага
            let closestMob = null;
            let minDist = 300; // Радиус агра призрака
            
            for (let mob of mobs) {
                const dX = mob.x - this.x;
                const dY = mob.y - this.y;
                const d = Math.sqrt(dX*dX + dY*dY);
                if (d < minDist && !mob.isDead) {
                    minDist = d;
                    closestMob = mob;
                }
            }
            this.targetMob = closestMob;
        }

        if (this.targetMob) {
            this.state = 'attacking';
            const dx = this.targetMob.x - this.x;
            const dy = this.targetMob.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            // Летим к врагу
            if (dist > 10) {
                this.x += (dx / dist) * (this.speed * 1.2);
                this.y += (dy / dist) * (this.speed * 1.2);
            }

            // Наносим урон
            // Внутри update, где логика атаки:
if (dist < 50 && this.attackCooldown <= 0) {
    // Пытаемся нанести урон через системный метод моба
    if (this.targetMob.takeDamage) {
        this.targetMob.takeDamage(1); 
    } else {
        this.targetMob.hp -= 1; // Запасной вариант, если метода нет
    }

    this.attackCooldown = 180; // Кулдаун 3 секунды
    
    // Отскок назад после удара
    this.x -= (dx / dist) * 30;
    this.y -= (dy / dist) * 30;
    console.log("Призрак успешно нанес урон!");
}
        } else {
            // 5. ОБЫЧНОЕ СЛЕДОВАНИЕ ЗА ИГРОКОМ
            this.state = 'following';
            // Висим чуть сзади и выше игрока
            const targetX = player.x + (player.direction === 1 ? -40 : 40); 
            const targetY = player.y - 30;
            
            this.x += (targetX - this.x) * 0.05;
            this.y += (targetY - this.y) * 0.05;
            
            // Эффект парения
            this.y += Math.sin(Date.now() / 200) * 0.5;
        }
    }

draw(ctx) {
    const drawX = this.x; 
    const drawY = this.y;

    // Мигание при уроне
    if (this.waterDamageTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;

    // СИНХРОНИЗАЦИЯ: используем assets.ghost, как в твоем файле
    if (assets.ghost && assets.ghost.complete && assets.ghost.naturalWidth !== 0) {
        
        // Рисуем пузырь, если он есть
        if (this.hasBubble && assets.bubble_pitomets) {
            ctx.globalAlpha = 0.6;
            ctx.drawImage(assets.bubble_pitomets, drawX - 5, drawY - 5, this.width + 10, this.height + 10);
            ctx.globalAlpha = 1.0;
        }
        
        // Рисуем самого призрака
        ctx.drawImage(assets.ghost, drawX, drawY, this.width, this.height);
        
    } else {
        // Заглушка (белый кружок)
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(drawX + this.width/2, drawY + this.height/2, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    // Полоска ХП
    if (this.isTamed && this.hp < this.maxHp) {
        ctx.fillStyle = "red";
        ctx.fillRect(drawX, drawY - 8, this.width, 3);
        ctx.fillStyle = "lime";
        ctx.fillRect(drawX, drawY - 8, this.width * (this.hp / this.maxHp), 3);
    }

    // === КРАСИВЫЙ ЭФФЕКТ СВЕЧЕНИЯ (вместо вспышки на весь экран) ===
    if (this.showFlash) {
        ctx.save();
        
        // Центр призрака
        const centerX = drawX + this.width / 2;
        const centerY = drawY + this.height / 2;
        
        // Настройки свечения
        const radius = 100; // Радиус света
        // Цвет: золотистый для приручения, голубой для пузыря
        const color = this.state === "following" && this.hasBubble ? "60, 200, 255" : "255, 230, 100";

        // Создаем радиальный градиент (от центра к краям)
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, `rgba(${color}, 1)`);   // В центре ярко
        gradient.addColorStop(0.3, `rgba(${color}, 0.8)`); // Чуть дальше
        gradient.addColorStop(1, `rgba(${color}, 0)`);   // На краях полностью прозрачно

        // Режим наложения "экран" (делает свет ярче)
        ctx.globalCompositeOperation = 'screen';
        
        ctx.fillStyle = gradient;
        // Рисуем круг с градиентом
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        
        // Сбрасываем триггер. Если хочешь, чтобы свечение длилось дольше,
        // нужно вводить таймер в update, а не сбрасывать здесь сразу.
        this.showFlash = false; 
    }
}
}
