// src/core/audioManager.js
export const audioManager = {
    currentMusic: null,
    nextMusic: null,
    fadeInterval: null,
    unlocked: false,
    isPausedBySystem: false,
    pendingMusic: null,

    playMusic(key, fadeTime = 2000) {
        if (!this.unlocked) {
            this.pendingMusic = key;
            return;
        }

        // Если эта музыка уже играет — ничего не делаем
        if (this.currentMusic && this.currentMusic.dataset.key === key) return;
        // Если она готовится играть — тоже выходим
        if (this.nextMusic && this.nextMusic.dataset.key === key) return;

        // 1. Очищаем старые интервалы перехода
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }

        // 2. Если есть "зависающая" следующая музыка, которая не успела стать текущей — гасим её
        if (this.nextMusic) {
            this.stopTrack(this.nextMusic);
            this.nextMusic = null;
        }

        const targetVolume = (key === "ambient" || key === "evil") ? 0.15 : 0.35;

        // --- МГНОВЕННОЕ ПЕРЕКЛЮЧЕНИЕ ---
        if (fadeTime <= 0) {
            if (this.currentMusic) this.stopTrack(this.currentMusic);
            this.currentMusic = this.createTrack(key, targetVolume);
            this.currentMusic.play().catch(e => console.warn("Audio play error:", e));
            return;
        }

        // --- ПЛАВНОЕ ПЕРЕКЛЮЧЕНИЕ ---
        const newTrack = this.createTrack(key, 0); // Начинаем с тишины
        this.nextMusic = newTrack;
        newTrack.play().catch(e => console.warn("Audio play error:", e));

        const steps = 20;
        let step = 0;
        const startCurrentVolume = this.currentMusic ? this.currentMusic.volume : 0;

        this.fadeInterval = setInterval(() => {
            step++;
            const progress = step / steps;

            // Громкость новой музыки вверх
            if (this.nextMusic) {
                this.nextMusic.volume = progress * targetVolume;
            }

            // Громкость старой музыки вниз
            if (this.currentMusic) {
                this.currentMusic.volume = Math.max(0, startCurrentVolume * (1 - progress));
            }

            if (step >= steps) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;

                if (this.currentMusic) {
                    this.stopTrack(this.currentMusic);
                }
                
                this.currentMusic = this.nextMusic;
                this.nextMusic = null;
            }
        }, fadeTime / steps);
    },

    // Вспомогательная функция для создания объекта Audio
    createTrack(key, volume) {
        const audio = new Audio(`./assets/audio/music/${key}.mp3`);
        audio.loop = true;
        audio.volume = volume;
        audio.dataset.key = key;
        return audio;
    },

    // Правильная остановка трека
    stopTrack(audio) {
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
        // Убираем ссылку, чтобы помочь сборщику мусора
        audio.onended = null; 
    },

    stopMusic() {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
        this.stopTrack(this.currentMusic);
        this.stopTrack(this.nextMusic);
        this.currentMusic = null;
        this.nextMusic = null;
    },

    // Остальное без изменений (pauseAll, resumeAll, playSFX, и т.д.)
    pauseAll() {
        if (this.currentMusic && !this.currentMusic.paused) {
            this.currentMusic.pause();
            this.isPausedBySystem = true;
        }
    },

    resumeAll() {
        if (this.isPausedBySystem && this.currentMusic) {
            this.currentMusic.play().catch(e => console.error(e));
            this.isPausedBySystem = false;
        }
    },

    playSFX(path, volume = 0.3) {
        const extension = path.includes('.') ? '' : '.mp3';
        const sound = new Audio(`./assets/audio/sfx/${path}${extension}`);
        sound.volume = volume;
        sound.play().catch(() => {});
    },

    unlockAudio() {
        if (this.unlocked) return;
        this.unlocked = true;
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

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) this.pauseAll();
            else this.resumeAll();
        });
    }
};