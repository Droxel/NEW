// BossManager.js
import { CubeBoss } from "./CubeBoss.js";     // Лежат в той же папке
import { DesertBoss } from "./DesertBoss.js"; 
import { JungleBoss } from "./JungleBoss.js";
import { audioManager } from "../../core/AudioManager.js"; // Выходим из entities/bosses/ в src/
import { GameState } from "../../core/GameState.js";
import { world } from "../../world/World.js";
import { BIOME_CORES } from "../../data/lootConfig.js";
import { DroppedItem } from "../../world/objects/DroppedItem.js";

export const bossManager = {
    boss: null,
    
    // Реестр классов боссов
    registry: {
        'cube_boss': CubeBoss,
        'desert_boss': DesertBoss, // <--- ИСПОЛЬЗУЕМ НОВЫЙ КЛАСС
        'ice_boss': CubeBoss,      
        'jungle_boss': JungleBoss,
        'forest_boss': CubeBoss  
    },

spawn(bossKey, x, y) {
        if (this.boss) this.boss = null;

        const BossClass = this.registry[bossKey];
        if (!BossClass) return false;

        this.currentBossKey = bossKey; // <--- ЗАПОМИНАЕМ ТИП БОССА
        this.boss = new BossClass(x); 
        
        // УДАЛИ ИЛИ ЗАКОММЕНТИРУЙ ЭТУ СТРОКУ:
        // audioManager.playMusic('boss_theme'); 
        
        return true;
    },

// src/entities/bosses/BossManager.js

update(player) {
    if (this.boss) {
        this.boss.update(player);

        // Условие: босс мертв и анимация смерти (таймер) завершилась
        if (!this.boss.isAlive && this.boss.timers.death > 100) {
            console.log("🎉 Босс побежден, генерируем лут для:", this.currentBossKey);
            
            // 1. Берем данные из конфига
            const coreData = BIOME_CORES[this.currentBossKey];
            
            if (coreData) {
    const centerX = this.boss.x + (this.boss.width || 32) / 2;
    
    // ПРАВИЛЬНЫЙ СПАВН: Берем высоту поверхности земли прямо под боссом
    const groundY = world.getHeight(centerX, true); 

    // Спавним ядро точно над землей (на 50 пикселей выше поверхности)
    // Теперь оно НЕ заспавнится под землей, даже если босс огромный
    const droppedCore = new DroppedItem(centerX, groundY - 50, { ...coreData });

    // Даем красивый импульс вылета
    droppedCore.vx = (Math.random() - 0.5) * 6; 
    droppedCore.vy = -7; 

    if (!window.droppedItems) window.droppedItems = []; 
    window.droppedItems.push(droppedCore);

    console.log("💎 Ядро босса вылетело на поверхность!");

            } else {
                console.warn("⚠️ Лут не найден в lootConfig.js для:", this.currentBossKey);
            }

            // 5. Логика прогрессии мира
            if (!GameState.bossesDefeated[this.currentBossKey]) {
                GameState.bossesDefeated[this.currentBossKey] = true;
                if (world.corruptionManager) world.corruptionManager.spreadCorruption(this.currentBossKey);
                if (world.replaceStatuesWithAltars) world.replaceStatuesWithAltars(this.currentBossKey);
            }

            // 6. Завершение битвы
            this.stopBossMusic();
            this.boss = null; 
            this.currentBossKey = null; // Очищаем ключ, битва окончена
        }
    }
},

    draw(ctx) {
        // Рисуем всегда, пока объект существует
        if (this.boss) {
            this.boss.draw(ctx);
        }
    },

    stopBossMusic() {
        audioManager.stopMusic();
    }
};