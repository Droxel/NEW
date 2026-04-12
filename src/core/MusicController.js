/* src/core/MusicController.js */
import { audioManager } from "./AudioManager.js";

export const musicController = {
    // Список треков боссов для мгновенного переключения (fadeTime = 0)
    bossTracks: ["desert_boss", "forest_boss", "junglm_boss", "skeleton_boss"],

    update(player, bossManager, mobManager, world) {
        const boss = bossManager.boss;
        let targetTheme = "ambient"; // По умолчанию
        let fadeTime = 4000;         // Плавный переход для эмбиента

        // 1. ПРОВЕРКА НА БОССА
        if (boss && boss.isAlive) {
            const bossMusicMap = {
                'desert_boss': 'desert_boss',
                'forest_boss': 'forest_boss',
                'jungle_boss': 'junglm_boss',
                'skeleton_boss': 'skeleton_boss'
            };
            
            targetTheme = bossMusicMap[bossManager.currentBossKey] || 'evil'; 
            fadeTime = 0; // На боссах музыка включается резко
        } 
        // 2. ПРОВЕРКА НА ДАНЖ
        else if (mobManager.isPointInDungeon(player.x + player.size / 2, player.y + player.size / 2)) {
            targetTheme = "danjunglei"; 
        } 
        // 3. ПРОВЕРКА НА ПОРЧУ (EVIL)
        else if (world.corruptionManager && world.corruptionManager.visualAlpha > 0.3) {
            targetTheme = "evil";
        }

        // 4. ЛОГИКА ПОБЕДЫ (если играл босс, а теперь нет — выключаем резко)
        if (audioManager.currentMusic) {
            const currentKey = audioManager.currentMusic.dataset.key;
            if (this.bossTracks.includes(currentKey) && !this.bossTracks.includes(targetTheme)) {
                fadeTime = 0;
            }
        }

        // Запускаем проигрывание через менеджер
        audioManager.playMusic(targetTheme, fadeTime);
    }
};