/* src/entities/bosses/BossManager.js */
import { CubeBoss } from "./CubeBoss.js";
import { DesertBoss } from "./DesertBoss.js"; 
import { JungleBoss } from "./JungleBoss.js";
import { SkeletonBoss } from "./SkeletonBoss.js";
import { audioManager } from "../../core/AudioManager.js";
import { GameState } from "../../core/GameState.js";
import { world } from "../../world/World.js";
import { BIOME_CORES } from "../../data/lootConfig.js";
import { DroppedItem } from "../../world/objects/DroppedItem.js";
import { IceBoss } from "./ice_boss/IceBoss.js";

export const bossManager = {
    boss: null,
    currentBossKey: null,
    
// Реестр классов боссов
    registry: {
        'cube_boss': CubeBoss, 
        'desert_boss': DesertBoss,
        'ice_boss': IceBoss,      
        'jungle_boss': JungleBoss,
        'forest_boss': CubeBoss, // <-- ИСПРАВЛЕНИЕ: Теперь лесная статуя заспавнит Ледяного босса
        'skeleton_boss': SkeletonBoss, 
    },
    // Метод для получения света от босса (для освещения)
    getLights() {
        if (this.boss && typeof this.boss.getLights === 'function') {
            return this.boss.getLights();
        }
        return [];
    },

    // Основной метод спавна
    spawnBoss(bossKey, x, y, scene = null) {
        if (this.boss) {
            console.warn("[BossManager] Очищаем старого босса перед новым спавном.");
            this.boss = null;
        }

        const BossClass = this.registry[bossKey];
        if (!BossClass) {
            console.error(`%c[BossManager] ❌ Класс для "${bossKey}" не найден в реестре!`, "color: red;");
            return false;
        }

        this.currentBossKey = bossKey;
        // Создаем экземпляр босса
        this.boss = new BossClass(x, y, scene); 
        
        console.log(
            `%c[WORLD] ⚔️ Босс ${bossKey.toUpperCase()} заспавнен!`, 
            "color: #ff4500; font-weight: bold; background: #222; padding: 2px 5px;"
        );
        return true;
    },

    // Вспомогательный метод (если используется в других частях кода)
    spawn(bossKey, x, y) {
        return this.spawnBoss(bossKey, x, y);
    },

update(dt, player) { // Поменяли местами, чтобы соответствовать вызову в gameLoop
    if (!this.boss) return;

    this.boss.update(player, dt);

    if (!this.boss.isAlive && this.boss.timers && this.boss.timers.death > 100) {
        this.handleBossDeath();
    }
},

handleBossDeath() {
        console.log("🎉 Босс побежден:", this.currentBossKey);
        const coreData = BIOME_CORES[this.currentBossKey];
        
        if (coreData) {
            const centerX = this.boss.x + (this.boss.width || 32) / 2;
            const groundY = world.getHeight(centerX, true); 
            const droppedCore = new DroppedItem(centerX, groundY - 50, { ...coreData });

            droppedCore.vx = (Math.random() - 0.5) * 6; 
            droppedCore.vy = -7; 

            if (!window.droppedItems) window.droppedItems = []; 
            window.droppedItems.push(droppedCore);
        }

        // --- ЛОГИКА ПРОГРЕССИИ (Исправлено) ---
        if (!GameState.bossesDefeated[this.currentBossKey]) {
            GameState.bossesDefeated[this.currentBossKey] = true;
            
            // Распространяем порчу
            if (world.corruptionManager) world.corruptionManager.spreadCorruption(this.currentBossKey);
            
            // ВОТ ЭТА СТРОЧКА БЫЛА ПРОПУЩЕНА: Заменяем статуи на алтари
            if (world.replaceStatuesWithAltars) {
                world.replaceStatuesWithAltars(this.currentBossKey);
            }
        }

        this.stopBossMusic();
        this.boss = null; 
        this.currentBossKey = null;
    },
    draw(ctx, cameraX, cameraY) {
        if (this.boss) {
            this.boss.draw(ctx, cameraX, cameraY); 
        }
    },

    stopBossMusic() {
        audioManager.stopMusic();
    }
};