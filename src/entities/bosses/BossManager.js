// BossManager.js
import { CubeBoss } from "./cubeBoss/CubeBoss.js";
import { DesertBoss } from "./desertBoss/DesertBoss.js"; // <--- ДОБАВИТЬ ЭТО
import { audioManager } from "../../core/audioManager.js";
import { JungleBoss } from "./junglesBoss/JungleBoss.js";
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
        if (this.boss) { // Убрал проверку isAlive, чтобы старый босс точно удалился
             this.boss = null;
        }

const BossClass = this.registry[bossKey];
        if (!BossClass) {
            console.error(`❌ Босс "${bossKey}" не найден в реестре!`);
            return false;
        }

        console.log(`💀 ПРИЗЫВ: ${bossKey} на ${x}`);
        
        this.boss = new BossClass(x); // <-- Передаем только X, Y он сам найдет по земле
        
        audioManager.playMusic('boss_theme'); 

        return true;
    },

    update(player) {
        if (this.boss) {
            // Обновляем босса всегда, даже если он умирает (чтобы проиграть анимацию)
            this.boss.update(player);

            // Проверяем: если босс мертв И (опционально) анимация закончилась
            // В CubeBoss.js анимация управляется таймером death
            if (!this.boss.isAlive && this.boss.timers.death > 100) {
                console.log("🎉 Босс побежден и анимация прошла!");
                
                this.stopBossMusic();
                this.boss = null; // Удаляем только после анимации
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