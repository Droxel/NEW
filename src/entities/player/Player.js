//Player.js
import { CONFIG } from "../../data/config.js"; // Путь: Player -> player -> entities -> src -> data
import { world } from "../../world/World.js";
import { Bubble } from "./tools/Bubble.js";
import { GrapplingHook } from "./tools/GrapplingHook.js";
export const player = {
    // ХАРАКТЕРИСТИКИ
    hp: 3,
    maxHp: 3,
    invulnerableTimer: 0,
    timeSinceLastHit: 0,
    regenTimer: 0,
    bubbleInstance: null,
    potionCooldown: 0,

    // СОСТОЯНИЕ И ПОЗИЦИЯ
    rotation: 0,
    rotationSpeed: 0,
    rotationDir: 0,
    x: 100,
    y: CONFIG.groundY,
    size: 30, // Размер игрока (высота)
    color: "#140858",
    velocityX: 0,
    velocityY: 0,
    onGround: true,
    direction: 0,
    lookX: 0,
    targetLookX: 0,
    scaleX: 1,
    scaleY: 1,
    blink: 0,
    blinkTimer: 0,
    justLanded: false,
isFlying: false, // НОВОЕ: флаг полета
    flySpeed: 10,    // Скорость полета
    hook: null,
hasHookInInventory: false, // Будем переключать при подборе
    takeDamage(amount) {
        if (this.invulnerableTimer > 0) return;
        this.hp -= amount;
        this.invulnerableTimer = 60;
        this.timeSinceLastHit = 0;
        this.regenTimer = 0;
        console.log("Player hit! HP:", this.hp);
    },

jump() {
        // НОВОЕ: Если мы висим на крюке, пробел/прыжок отцепляет нас
        if (this.hook && this.hook.active && this.hook.hooked) {
            this.hook.release();
            this.velocityY = -CONFIG.jumpPower;
            this.onGround = false;
            return;
        }

        if (this.onGround) {
            this.velocityY = -CONFIG.jumpPower;
            this.onGround = false;
            // Добавляем эффект вращения
            if (this.velocityX !== 0) {
                this.rotationDir = Math.sign(this.velocityX);
                this.rotationSpeed = 0.25;
            }
        }
    },
    // ПРОВЕРКА СТОЛКНОВЕНИЙ СО СТЕНАМИ (Блоки данжа)
checkWallCollisions(axis) {
        if (!world.chunkManager) return;

        const chunkId = world.chunkManager.getChunkId(this.x);
        const chunk = world.chunkManager.chunks.get(chunkId);
        if (!chunk || !chunk.objects) return;

        for (let obj of chunk.objects) {
            // ЖЕЛЕЗОБЕТОННОЕ ПРАВИЛО: врезаемся и в данжи, и в колонны деревни!
            if (obj.type !== "dungeon_wall" && obj.type !== "village_wall") continue;

            // AABB Коллизия
            if (
                this.x < obj.x + obj.width &&
                this.x + this.size > obj.x &&
                this.y < obj.y + obj.height && 
                this.y + this.size > obj.y 
            ) {
                if (axis === 'x') {
                    if (this.velocityX > 0) { // Движемся вправо -> врезаемся левой стороной стены
                        this.x = obj.x - this.size;
                    } else if (this.velocityX < 0) { // Движемся влево -> врезаемся правой стороной
                        this.x = obj.x + obj.width;
                    }
                    this.velocityX = 0;
                }
                
                if (axis === 'y') {
                    if (this.velocityY > 0) { // Падаем вниз -> встаем на пол/колонну
                        this.y = obj.y - this.size; 
                        this.velocityY = 0;
                        this.onGround = true; // МЫ НА БЛОКЕ!
                    } else if (this.velocityY < 0) { // Прыгаем вверх -> бьемся головой
                        this.y = obj.y + obj.height;
                        this.velocityY = 0;
                    }
                }
            }
        }
    },

update() {
    // Если игрок мертв, не даем ему двигаться и обновляться
    if (this.hp <= 0) {
        this.velocityX = 0;
        this.velocityY = 0;
        return; 
    }
    // 1. ТАЙМЕРЫ И РЕГЕНЕРАЦИЯ (без изменений)
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;
    if (this.potionCooldown > 0) this.potionCooldown--;
    if (this.hp < this.maxHp) {
        this.timeSinceLastHit++;
        if (this.timeSinceLastHit > 300) {
            this.regenTimer++;
            if (this.regenTimer >= 180) {
                this.hp++;
                this.regenTimer = 0;
            }
        }
    }

    // 2. ДВИЖЕНИЕ (ГЛАВНОЕ ИСПРАВЛЕНИЕ)
    // Мы разделяем логику: либо КРЮК, либо ПОЛЕТ, либо ОБЫЧНАЯ ФИЗИКА
   // 2. ДВИЖЕНИЕ
    if (this.hook && this.hook.active && this.hook.hooked) {
        // РЕЖИМ КРЮКА
        this.onGround = false;
        this.rotation = 0;
        
        // Маленький хак: если мы висим, внешние силы (типа инерции от бега) не должны на нас влиять
        if (Math.abs(this.velocityX) > 16) this.velocityX = 0; 
        if (Math.abs(this.velocityY) > 16) this.velocityY = 0;
    }
    else if (this.isFlying) {
        // РЕЖИМ ПОЛЕТА
        this.x += this.velocityX * 1.5; 
        this.y += this.velocityY * 1.5;
        this.onGround = false;
        this.rotation = 0; 
    } 
else {
        // ОБЫЧНЫЙ РЕЖИМ
        
        // 1. Ограничиваем скорость падения (чтобы не пролетать сквозь землю)
        const MAX_FALL_SPEED = 25; 
        this.velocityY = Math.min(this.velocityY + CONFIG.gravity, MAX_FALL_SPEED);

        // Сохраняем позицию до движения для точных расчетов
        const prevY = this.y;

        this.x += this.velocityX;
        this.checkWallCollisions('x');

        this.y += this.velocityY;
        this.onGround = false; 
        this.checkWallCollisions('y');

        // 2. УЛУЧШЕННАЯ ПРОВЕРКА ПОВЕРХНОСТИ
        const groundY = world.getHeight(this.x);
        
        // Если в этом кадре мы пересекли линию земли сверху вниз
        // ИЛИ если мы находимся внутри земли, но не слишком глубоко (чтобы не мешать данжам)
        const crossedGround = (prevY <= groundY && this.y >= groundY);
        const isInsideGround = (this.y > groundY && this.y - groundY < 200);

        if (this.velocityY >= 0 && (crossedGround || isInsideGround)) {
            // Если мы не в зоне входа в данж (где Y резко уходит вниз на 20,000)
            // Или если мы просто падаем на обычную землю
            if (!this.onGround) this.justLanded = true;
            this.y = groundY;
            this.velocityY = 0;
            this.onGround = true;
        }

        // 3. ЗАЩИТА ОТ ВЫПАДЕНИЯ (Спасательный круг)
        // Если упал ниже уровня данжа (аномальная зона)
        if (this.y > 35000) {
            console.warn("🆘 Игрок выпал за мир! Респавн на поверхность.");
            this.spawn(this.x); 
        }
    }

    // 3. ВИЗУАЛЬНЫЕ ЭФФЕКТЫ (Оставляем как было)
    this.lookX += (this.targetLookX - this.lookX) * 0.15;
    if (!this.onGround) {
        this.scaleY += (1.15 - this.scaleY) * 0.2;
        this.scaleX += (0.9 - this.scaleX) * 0.2;
    } else {
        this.scaleX += (1 - this.scaleX) * 0.25;
        this.scaleY += (1 - this.scaleY) * 0.25;
    }

    // Блики и вращение
    this.blinkTimer++;
    if (this.blinkTimer > 180 && Math.random() < 0.02) {
        this.blink = 1;
        this.blinkTimer = 0;
    }
    this.blink += (0 - this.blink) * 0.2;

    if (!this.onGround && this.rotationDir !== 0 && !(this.hook && this.hook.active)) {
        this.rotation += this.rotationSpeed * this.rotationDir;
    } else if (this.onGround) {
        const snapped = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
        this.rotation += (snapped - this.rotation) * 0.3;
    }

    // 4. ОБНОВЛЕНИЕ СИСТЕМ (Инвентарь и Крюк)
    if (this.inventory && this.inventory.bubbleSlots && this.inventory.bubbleSlots[0]) {
        if (!this.bubbleInstance) this.bubbleInstance = new Bubble(this);
        this.bubbleInstance.update(this.inventory.bubbleSlots[1]);
    } else {
        this.bubbleInstance = null;
    }

    // Проверка наличия крюка
    let foundHook = false;
    if (this.inventory && this.inventory.mainSlots) {
        foundHook = this.inventory.mainSlots.some(item => item && item.id === 'hook');
    }

    if (foundHook !== this.hasHookInInventory) {
        this.hasHookInInventory = foundHook;
        const joy = document.getElementById("hook-joystick-container");
        if (joy) joy.style.display = foundHook ? "block" : "none";
    }

    // ВАЖНО: Вызываем обновление крюка в самом конце
    if (this.hook) this.hook.update();
},
/* Внутри объекта player в src/entities/player.js */

eatPotion() {
    // 1. Проверяем кулдаун и не полное ли здоровье
    if (this.potionCooldown > 0) return;
    if (this.hp >= this.maxHp) return;

    // 2. Ищем зелье ВО ВСЕМ инвентаре (а не только в первых 5 слотах)
    if (!this.inventory || !this.inventory.mainSlots) return;
    
    // Ищем индекс предмета 'potion_hp' во всем массиве mainSlots
    const potionIndex = this.inventory.mainSlots.findIndex(item => item && item.id === 'potion_hp');

    if (potionIndex !== -1) {
        // 3. Применяем эффект
        this.hp = Math.min(this.hp + 5, this.maxHp);
        
        // 4. Уменьшаем количество зелий
        this.inventory.mainSlots[potionIndex].count--;

        // Если зелья кончились — удаляем предмет из слота
        if (this.inventory.mainSlots[potionIndex].count <= 0) {
            this.inventory.mainSlots[potionIndex] = null;
        }

        // 5. Запускаем кулдаун (300 кадров = 5 секунд при 60 FPS)
        this.potionCooldown = 300;
        
        console.log("❤️ Здоровье восстановлено! HP:", this.hp);
        
        // Обновляем UI (используем правильную ссылку на экземпляр)
        if (window.inventoryUIInstance) {
            window.inventoryUIInstance.refresh(); 
        }
    } else {
        console.log("❌ Зелья 'potion_hp' нет в инвентаре");
    }
},
spawn(startX = 100) {
    this.x = startX;
    // Берем оригинальную высоту земли без учета бездны данжа для безопасного спавна
    const groundY = world.getHeight(this.x, true); 
    this.y = groundY - this.size - 50; // Ставим на 50 пикселей выше земли
    this.velocityY = 0;
    this.velocityX = 0;
    this.onGround = false;
    console.log(`🚀 Игрок заспавнен на высоте: ${this.y}`);
},
};