// BossManager.js
import { CubeBoss } from "./CubeBoss.js";     // Лежат в той же папке
import { DesertBoss } from "./DesertBoss.js"; 
import { JungleBoss } from "./JungleBoss.js";
import { audioManager } from "../../core/AudioManager.js"; // Выходим из entities/bosses/ в src/
import { GameState } from "../../core/GameState.js";
import { world } from "../../world/World.js";

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
        audioManager.playMusic('boss_theme'); 
        return true;
    },

update(player) {
        if (this.boss) {
            this.boss.update(player);

            if (!this.boss.isAlive && this.boss.timers.death > 100) {
                console.log("🎉 Босс побежден!");
                
                // --- ЛОГИКА ПОРЧИ ---
                if (!GameState.bossesDefeated[this.currentBossKey]) {
                    GameState.bossesDefeated[this.currentBossKey] = true;
                    world.corruptionManager.spreadCorruption(this.currentBossKey);
                    world.replaceStatuesWithAltars(this.currentBossKey);
                }
                // --------------------

                this.stopBossMusic();
                this.boss = null; 
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