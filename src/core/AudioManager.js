// src/core/audioManager.js
export const audioManager = {
    currentMusic: null,
    nextMusic: null, // Для плавного перехода
    fadeInterval: null,
    unlocked: false,
    isPausedBySystem: false,

playMusic(key, fadeTime = 2000) {
        if (!this.unlocked) {
            this.pendingMusic = key; 
            return;
        }

        if (this.currentMusic && this.currentMusic.dataset.key === key) return;
        if (this.nextMusic && this.nextMusic.dataset.key === key) return;

        // --- МГНОВЕННОЕ ПЕРЕКЛЮЧЕНИЕ ---
        if (fadeTime <= 0) {
            this.stopMusic(); // Останавливаем всё сразу
            const audio = new Audio(`./assets/audio/music/${key}.mp3`);
            audio.loop = true;
            audio.volume = (key === "ambient" || key === "evil") ? 0.15 : 0.35;
            audio.dataset.key = key;
            audio.play().catch(e => console.warn(e));
            this.currentMusic = audio;
            return;
        }

        if (this.fadeInterval) clearInterval(this.fadeInterval);

        const audio = new Audio(`./assets/audio/music/${key}.mp3`);
        audio.loop = true;
        audio.volume = 0; // Начинаем с нуля
        audio.dataset.key = key;
        this.nextMusic = audio;

        audio.play().catch(e => console.warn(e));

        const targetVolume = (key === "ambient" || key === "evil") ? 0.15 : 0.35;
        const steps = 20;
        let step = 0;

        this.fadeInterval = setInterval(() => {
            step++;
            const progress = step / steps;

            // Новая громкость вверх
            this.nextMusic.volume = progress * targetVolume;

            // Старая громкость вниз
            if (this.currentMusic) {
                this.currentMusic.volume = Math.max(0, this.currentMusic.volume * (1 - progress));
            }

            if (step >= steps) {
                clearInterval(this.fadeInterval);
                if (this.currentMusic) {
                    this.currentMusic.pause();
                    this.currentMusic.currentTime = 0;
                }
                this.currentMusic = this.nextMusic;
                this.nextMusic = null;
            }
        }, fadeTime / steps);
    },

    stopMusic() {
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        if (this.currentMusic) { this.currentMusic.pause(); this.currentMusic = null; }
        if (this.nextMusic) { this.nextMusic.pause(); this.nextMusic = null; }
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