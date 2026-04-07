//Player.js
import { CONFIG } from "../../data/config.js";
import { world } from "../../world/World.js";
import { Bubble } from "./tools/Bubble.js";
import { GrapplingHook } from "./tools/GrapplingHook.js";

export const player = {
    // ХАРАКТЕРИСТИКИ
    hp: 30,
    maxHp: 30,
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
    color: "#192774",
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
    isFlying: false, // флаг полета
    flySpeed: 10,    // Скорость полета
    hook: null,
    hasHookInInventory: false,
    air: 10,
    maxAir: 10,
    airTimer: 0,
    baseColor: "#3b52da", // Основной цвет
    currentColor: "#02030c", // Текущий цвет (меняется в воде)

    takeDamage(amount) {
        if (this.invulnerableTimer > 0) return;
        this.hp -= amount;
        this.invulnerableTimer = 60;
        this.timeSinceLastHit = 0;
        this.regenTimer = 0;
        console.log("Player hit! HP:", this.hp);
    },

jump() {
        // Проверяем, в воде ли мы прямо сейчас
        const waterData = world.getWaterData(this.x);
        const inWater = waterData.isWater && (this.y + 10 > waterData.level);

        // Если мы висим на крюке
        if (this.hook && this.hook.active && this.hook.hooked) {
            this.hook.release();
            this.velocityY = -CONFIG.jumpPower;
            this.onGround = false;
            return;
        }

        // НОВОЕ: Прыжок в воде (выпрыгивание/плавание)
        if (inWater) {
            // Делаем прыжок слабым (-4 вместо стандартных -15), 
            // чтобы просто подняться к поверхности и вдохнуть
            this.velocityY = -4; 
            this.onGround = false;
            return;
        }

        // Обычный прыжок на земле
        if (this.onGround) {
            this.velocityY = -CONFIG.jumpPower;
            this.onGround = false;
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
        // ✅ ДОБАВЛЯЕМ "jungle_seal" в список твердых объектов
        if (
            obj.type !== "dungeon_wall" && 
            obj.type !== "village_wall" && 
            obj.type !== "jungle_seal" // Теперь игрок будет врезаться в печать
        ) continue;

        // AABB Коллизия (оставляем без изменений)
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
        if (this.hp <= 0) return;

        // 1. ТАЙМЕРЫ И РЕГЕНЕРАЦИЯ
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

// 2. ПРОВЕРКА ВОДЫ
        const waterData = world.getWaterData(this.x);
        const inWater = waterData.isWater && (this.y + 10 > waterData.level);
        this.isInWater = inWater; // Сохраняем состояние для других проверок

        if (inWater) {
            this.velocityX *= 0.5; 
            // Увеличили с 0.7 до 0.9, чтобы падать в воде чуть быстрее (не так заторможенно)
            if (this.velocityY > 0) this.velocityY *= 0.9; 
            
            this.currentColor = "#0a1240"; 
            
            this.airTimer++;
            if (this.airTimer >= 60) {
                if (this.air > 0) {
                    this.air--;
                } else {
                    this.takeDamage(1);
                }
                this.airTimer = 0;
            }
        } else {
            this.currentColor = this.baseColor;
            this.air = this.maxAir;
            this.airTimer = 0;
        }

        // 3. ДВИЖЕНИЕ
        if (this.hook && this.hook.active && this.hook.hooked) {
            // РЕЖИМ КРЮКА
            this.onGround = false;
            this.rotation = 0;
            // Инерция от бега не должна влиять
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
            // ОБЫЧНЫЙ РЕЖИМ (Гравитация считается строго один раз)
            const MAX_FALL_SPEED = 25; 
            
            if (!inWater) {
                this.velocityY = Math.min(this.velocityY + CONFIG.gravity, MAX_FALL_SPEED);
            } else {
                // В воде гравитация слабее
                this.velocityY = Math.min(this.velocityY + CONFIG.gravity * 0.3, 4);
            }

            // Сохраняем позицию до движения
            const prevY = this.y;

            // Движение по X и коллизии
            this.x += this.velocityX;
            this.checkWallCollisions('x');

            // Движение по Y и коллизии
            this.y += this.velocityY;
            this.onGround = false; 
            this.checkWallCollisions('y');

            // Проверка поверхности земли
            const groundY = world.getHeight(this.x);
            const crossedGround = (prevY <= groundY && this.y >= groundY);
            const isInsideGround = (this.y > groundY && this.y - groundY < 200);

            if (this.velocityY >= 0 && (crossedGround || isInsideGround)) {
                if (!this.onGround) this.justLanded = true;
                this.y = groundY;
                this.velocityY = 0;
                this.onGround = true;
            }

            // ЗАЩИТА ОТ ВЫПАДЕНИЯ
            if (this.y > 35000) {
                console.warn("🆘 Игрок выпал за мир! Респавн на поверхность.");
                this.spawn(this.x); 
            }
        }

        // 4. ВИЗУАЛЬНЫЕ ЭФФЕКТЫ
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

        // ИСПРАВЛЕНО: Добавлено условие !this.isInWater
        // Теперь кубик НЕ крутится, если он в воде
        if (!this.onGround && this.rotationDir !== 0 && !(this.hook && this.hook.active) && !this.isInWater) {
            this.rotation += this.rotationSpeed * this.rotationDir;
        } else if (this.onGround || this.isInWater) {
            // Если в воде или на земле — плавно выравниваемся вертикально
            const snapped = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
            this.rotation += (snapped - this.rotation) * 0.3;
        }

        // 5. ОБНОВЛЕНИЕ СИСТЕМ (Инвентарь и Крюк)
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

        if (this.hook) this.hook.update();
    },

    eatPotion() {
        if (this.potionCooldown > 0) return;
        if (this.hp >= this.maxHp) return;

        if (!this.inventory || !this.inventory.mainSlots) return;
        
        const potionIndex = this.inventory.mainSlots.findIndex(item => item && item.id === 'potion_hp');

        if (potionIndex !== -1) {
            this.hp = Math.min(this.hp + 5, this.maxHp);
            
            this.inventory.mainSlots[potionIndex].count--;

            if (this.inventory.mainSlots[potionIndex].count <= 0) {
                this.inventory.mainSlots[potionIndex] = null;
            }

            this.potionCooldown = 300;
            
            console.log("❤️ Здоровье восстановлено! HP:", this.hp);
            
            if (window.inventoryUIInstance) {
                window.inventoryUIInstance.refresh(); 
            }
        } else {
            console.log("❌ Зелья 'potion_hp' нет в инвентаре");
        }
    },

    spawn(startX = 100) {
        this.x = startX;
        const groundY = world.getHeight(this.x, true); 
        this.y = groundY - this.size - 50; 
        this.velocityY = 0;
        this.velocityX = 0;
        this.onGround = false;
        console.log(`🚀 Игрок заспавнен на высоте: ${this.y}`);
    }
};