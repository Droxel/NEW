//Player.js
import { CONFIG } from "../../data/config.js";
import { world } from "../../world/World.js";
import { Bubble } from "./tools/Bubble.js";
import { GrapplingHook } from "./tools/GrapplingHook.js";

// Импортируем нашу логику
import { handleJump, updateMovement } from "./PlayerMovement.js";
import { takeDamage, eatPotion, updateHealthAndAir } from "./PlayerHealth.js";
import { updateVisuals } from "./PlayerVisuals.js";
import { checkWallCollisions } from "./PlayerCollision.js";
import { krakenManager } from "../../entities/bosses/kraken/KrakenManager.js";

import { AccessoryManager } from "./accessories/AccessoryManager.js";

export const player = {
    // === ХАРАКТЕРИСТИКИ ===
    hp: 30, maxHp: 30, invulnerableTimer: 0, timeSinceLastHit: 0, regenTimer: 0,
    potionCooldown: 0, air: 10, maxAir: 10, airTimer: 0,
    
    // === СОСТОЯНИЕ И ПОЗИЦИЯ ===
    rotation: 0, rotationSpeed: 0, rotationDir: 0,
    x: 100, y: CONFIG.groundY, size: 30,
    velocityX: 0, velocityY: 0, onGround: true, direction: 0,
    lookX: 0, targetLookX: 0, scaleX: 1, scaleY: 1,
    blink: 0, blinkTimer: 0, justLanded: false,
    isFlying: false, flySpeed: 10, isInWater: false,
    
    // === ЭКИПИРОВКА И ИНВЕНТАРЬ ===
    bubbleInstance: null, hook: null, hasHookInInventory: false,
    baseColor: "#3b52da", currentColor: "#02030c", color: "#192774",

    // === ИНИЦИАЛИЗАЦИЯ МЕНЕДЖЕРА АКСЕССУАРОВ ===
    // Создаем экземпляр класса для конкретного игрока
    accessories: null, 

    // === ДЕЛЕГИРУЕМ МЕТОДЫ ===
    takeDamage(amount) { takeDamage(this, amount); },
    jump() { handleJump(this); },
    eatPotion() { eatPotion(this); },
    checkWallCollisions(axis) { checkWallCollisions(this, axis); },

    spawn(startX = 100) {
        this.x = startX;
        const groundY = world.getHeight(this.x, true); 
        this.y = groundY - this.size - 50; 
        this.velocityY = 0;
        this.velocityX = 0;
        this.onGround = false;
        
        // Инициализируем менеджер при спавне, если еще не создан
        if (!this.accessories) {
            this.accessories = new AccessoryManager(this);
        }
        console.log(`🚀 Игрок заспавнен на высоте: ${this.y}`);
    },

    update() {
        if (this.hp <= 0) return;

        // Гарантируем наличие менеджера аксессуаров
        if (!this.accessories) this.accessories = new AccessoryManager(this);

        // ОБНОВЛЯЕМ АКСЕССУАРЫ (сканируем слоты инвентаря и собираем баффы)
        this.accessories.update();

        // 1. Таймеры, здоровье, воздух (теперь внутри читаются данные из менеджера)
        updateHealthAndAir(this);

        // 2. Движение и коллизии
        updateMovement(this, krakenManager.kraken);

        // 3. Визуальные эффекты (масштаб, вращение)
        updateVisuals(this);

        // 4. Логика старого пузыря-оружия/инструмента (раз ты говоришь, что Bubble.js — это другое)
        // Если тебе все еще нужен старый пузырь из bubbleSlots, оставляем этот код:
        if (this.inventory?.bubbleSlots?.[0]) {
            if (!this.bubbleInstance) this.bubbleInstance = new Bubble(this);
            this.bubbleInstance.update(this.inventory.bubbleSlots[1]);
        } else {
            this.bubbleInstance = null;
        }

        let foundHook = this.inventory?.mainSlots?.some(item => item?.id === 'hook') || false;
        if (foundHook !== this.hasHookInInventory) {
            this.hasHookInInventory = foundHook;
            const joy = document.getElementById("hook-joystick-container");
            if (joy) joy.style.display = foundHook ? "block" : "none";
        }

        if (this.hook) this.hook.update();
    }
};