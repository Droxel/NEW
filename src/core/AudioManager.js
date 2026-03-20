// src/core/audioManager.js
export const audioManager = {
    currentMusic: null,
    unlocked: false,
    isPausedBySystem: false, // Флаг, чтобы знать, что мы сами поставили на паузу

    playMusic(key) {
        if (!this.unlocked) {
            this.pendingMusic = key; 
            return;
        }

        if (this.currentMusic && this.currentMusic.dataset.key === key) {
            return;
        }

        this.stopMusic();

        const audio = new Audio(`./assets/audio/music/${key}.mp3`);
        audio.loop = true;
        audio.volume = key === "ambient" ? 0.15 : 0.35;
        audio.dataset.key = key;

        audio.play().catch(err => {
            console.warn("❌ Ошибка воспроизведения:", err);
        });

        this.currentMusic = audio;
    },

    stopMusic() {
        if (!this.currentMusic) return;
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
        this.currentMusic = null;
    },

    // --- НОВЫЕ МЕТОДЫ ДЛЯ ВЫХОДА ИЗ ПРИЛОЖЕНИЯ ---
    pauseAll() {
        if (this.currentMusic && !this.currentMusic.paused) {
            this.currentMusic.pause();
            this.isPausedBySystem = true;
            console.log("⏸ Музыка на паузе (приложение свернуто)");
        }
    },

    resumeAll() {
        if (this.isPausedBySystem && this.currentMusic) {
            this.currentMusic.play().catch(e => console.error(e));
            this.isPausedBySystem = false;
            console.log("▶️ Музыка возобновлена (вернулись в игру)");
        }
    },
    
    // Метод для коротких звуков (эффекты, голоса)
    playSFX(path, volume = 0.3) {
        // Путь указываем относительно корня или папки sfx
        const sound = new Audio(`./assets/audio/sfx/${path}.mp3`);
        sound.volume = volume;
        sound.play().catch(err => {
            // Игнорируем ошибки, если звук не успел загрузиться
        });
    },
    // --------------------------------------------

    unlockAudio() {
        if (this.unlocked) return;

        this.unlocked = true;
        console.log("🔊 Аудио разблокировано");

        if (this.pendingMusic) {
            this.playMusic(this.pendingMusic);
            this.pendingMusic = null;
        } else {
            this.playMusic("ambient");
        }
    },

    initUnlock() {
        const unlock = () => {
            this.unlockAudio();
            ["click", "touchstart", "keydown"].forEach(type => 
                document.removeEventListener(type, unlock)
            );
        };

        document.addEventListener("click", unlock);
        document.addEventListener("touchstart", unlock);
        document.addEventListener("keydown", unlock);

        // --- ДОБАВЛЯЕМ СЛЕЖКУ ЗА ВИДИМОСТЬЮ ---
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                this.pauseAll();
            } else {
                this.resumeAll();
            }
        });

        // Для Cordova (мобилки)
        document.addEventListener("pause", () => this.pauseAll(), false);
        document.addEventListener("resume", () => this.resumeAll(), false);
    }
};