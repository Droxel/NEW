/* src/core/MusicController.js */
import { audioManager } from "./AudioManager.js";
import { getOceanMix } from "../world/Ocean.js"; 
// НАДО ДОБАВИТЬ ЭТОТ ИМПОРТ:
import { krakenManager } from "../entities/bosses/kraken/KrakenManager.js"; 

export const musicController = {
    // Добавим kraken в список треков боссов, чтобы музыка переключалась мгновенно, если нужно
    bossTracks: ["desert_boss", "forest_boss", "junglm_boss", "skeleton_boss", "ice_boss", "kraken"], 
    lastInWater: false,
    currentTheme: null, 

    update(player, bossManager, mobManager, world) {
        if (!player || !world) return;

        const boss = bossManager.boss;
        let targetTheme = "ambient"; 
        let fadeTime = 4000;

        // 1. ПРИОРИТЕТ: БОССЫ
        if (boss && boss.isAlive) {
            const bossMusicMap = {
                'desert_boss': 'desert_boss',
                'forest_boss': 'forest_boss',
                'jungle_boss': 'junglm_boss',
                'skeleton_boss': 'skeleton_boss',
                'ice_boss': 'ice_boss' 
            };
            targetTheme = bossMusicMap[bossManager.currentBossKey] || 'evil'; 
            fadeTime = 0; 
        }
        // --- ИСПРАВЛЕНО: ПРОВЕРКА КРАКЕНА ЧЕРЕЗ МЕНЕДЖЕР ---
        else if (krakenManager && krakenManager.kraken && !krakenManager.kraken.isDead) {
            targetTheme = "kraken";
            fadeTime = 2000; // Плавное появление за 2 секунды
        }
        // 2. КОРАБЛЬ
        else if (world.cursedShip && world.cursedShip.state !== 'sleeping') {
            if (world.cursedShip.shouldStartMusic) {
                targetTheme = "ship";
                fadeTime = 5000;
            } else {
                targetTheme = "ambient"; 
            }
        }
        // 3. ДАНЖ
        else if (mobManager.isPointInDungeon(player.x + player.size / 2, player.y + player.size / 2)) {
            targetTheme = "danjunglei"; 
        } 
        // 4. ПОРЧА
        else if (world.corruptionManager && world.corruptionManager.visualAlpha > 0.3) {
            targetTheme = "evil";
        }

        // ПРОВЕРКА: Если тема сменилась с босса на обычную — сброс fade
        if (audioManager.currentMusic) {
            const currentKey = audioManager.currentMusic.dataset.key;
            if (this.bossTracks.includes(currentKey) && !this.bossTracks.includes(targetTheme)) {
                fadeTime = 0;
            }
        }

        // ВЫЗЫВАЕМ ТОЛЬКО ЕСЛИ ТЕМА ИЗМЕНИЛАСЬ
        if (this.currentTheme !== targetTheme) {
            this.currentTheme = targetTheme;
            console.log(`🎵 Музыка контроллера переключена на: ${targetTheme}`); // Сюда будет писать при спавне
            audioManager.playMusic(targetTheme, fadeTime);
        }

        this.updateOceanAmbient(player);
    },

    updateOceanAmbient(player) {
        const oceanMix = getOceanMix(player.x);
        const inWater = player.isInWater;

        if (inWater && !this.lastInWater) {
            audioManager.playRandomSFX('world/ocean', 'splash', 4, 0.05, '.wav');            
            const underwaterTracks = ['underwater.wav', 'underwater-sounds-2.wav'];
            audioManager.currentUnderwaterKey = underwaterTracks[Math.floor(Math.random() * underwaterTracks.length)];
        }
        this.lastInWater = inWater;

        const MAX_VOL = 0.15; 
        const UNDERWATER_VOL = 0.4;

        let beachTarget = (!inWater && oceanMix.active) ? (oceanMix.beach * (1 - oceanMix.weight)) * MAX_VOL : 0;
        let deepTarget = (!inWater && oceanMix.active) ? oceanMix.weight * MAX_VOL : 0;
        let underwaterTarget = (inWater) ? UNDERWATER_VOL : 0;

        audioManager.updateAmbientVolume('ocean_beach', 'world/ocean/waves_sand.wav', beachTarget);
        audioManager.updateAmbientVolume('ocean_deep', 'world/ocean/waves.wav', deepTarget);

        if (audioManager.currentUnderwaterKey) {
            audioManager.updateAmbientVolume('ocean_underwater', `world/ocean/${audioManager.currentUnderwaterKey}`, underwaterTarget);
        }
    }
};