/* src/core/audioManager.js */
export const audioManager = {
    currentMusic: null,
    nextMusic: null,
    fadeInterval: null,
    unlocked: false,
    pendingMusic: null,
    ambientSounds: {},
    isPausedBySystem: false,

    // ГЛАВНЫЙ МЕТОД ДЛЯ МУЗЫКИ
    playMusic(key, fadeTime = 2000) {
        if (!this.unlocked) {
            this.pendingMusic = key;
            return;
        }

        // Если эта музыка уже играет или готовится — ничего не делаем
        if (this.currentMusic && this.currentMusic.dataset.key === key) return;
        if (this.nextMusic && this.nextMusic.dataset.key === key) return;

        console.log(`🎵 Переключение музыки на: ${key}`);

        // Очищаем старый переход, если он идет прямо сейчас
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }

        if (this.nextMusic) {
            this.stopTrack(this.nextMusic);
            this.nextMusic = null;
        }

        // Громкость: для эмбиента тише, для боссов/кракена громче
        const targetVolume = (key === "ambient" || key === "evil") ? 0.15 : 0.35;

        // --- МГНОВЕННОЕ ПЕРЕКЛЮЧЕНИЕ ---
        if (fadeTime <= 0) {
            if (this.currentMusic) this.stopTrack(this.currentMusic);
            this.currentMusic = this.createTrack(key, targetVolume);
            this.safePlay(this.currentMusic);
            return;
        }

        // --- ПЛАВНОЕ ПЕРЕКЛЮЧЕНИЕ ---
        const newTrack = this.createTrack(key, 0);
        this.nextMusic = newTrack;
        this.safePlay(newTrack);

        const steps = 20;
        let step = 0;
        const startCurrentVolume = this.currentMusic ? this.currentMusic.volume : 0;

        this.fadeInterval = setInterval(() => {
            step++;
            const progress = step / steps;

            if (this.nextMusic) {
                this.nextMusic.volume = progress * targetVolume;
            }

            if (this.currentMusic) {
                this.currentMusic.volume = Math.max(0, startCurrentVolume * (1 - progress));
            }

            if (step >= steps) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;

                if (this.currentMusic) this.stopTrack(this.currentMusic);
                this.currentMusic = this.nextMusic;
                this.nextMusic = null;
            }
        }, fadeTime / steps);
    },

    createTrack(key, volume) {
        const audio = new Audio(`./assets/audio/music/${key}.mp3`);
        audio.loop = true;
        audio.volume = volume;
        audio.dataset.key = key;
        return audio;
    },

    safePlay(audio) {
        if (!audio) return;
        audio.play().catch(e => {
            if (e.name !== 'AbortError') console.warn("Audio play error:", e);
        });
    },

    stopTrack(audio) {
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
    },

    stopMusic() {
        if (this.fadeInterval) clearInterval(this.fadeInterval);
        this.stopTrack(this.currentMusic);
        this.stopTrack(this.nextMusic);
        this.currentMusic = null;
        this.nextMusic = null;
    },

    playSFX(path, volume = 0.3) {
        const ext = path.includes('.') ? '' : '.mp3';
        const sound = new Audio(`./assets/audio/sfx/${path}${ext}`);
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

        // Для браузера (когда сворачиваешь вкладку)
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) this.pauseAll(); // Убедись, что методы pauseAll/resumeAll у тебя написаны!
            else this.resumeAll();
        });

        // Для Cordova (сворачивание на телефоне)
        document.addEventListener("pause", () => this.pauseAll(), false);
        document.addEventListener("resume", () => this.resumeAll(), false);

        // ==========================================
        // ДОБАВЬ ЭТОТ БЛОК: Жесткое глушение звуков при закрытии окна/вкладки
        // ==========================================
        window.addEventListener("beforeunload", () => {
            this.stopEverything();
        });
    },
playRandomSFX(folder, prefix, count, volume = 0.3, ext = '.mp3') {
        const rand = Math.floor(Math.random() * count) + 1;
        // Передаем путь сразу с расширением
        this.playSFX(`${folder}/${prefix}${rand}${ext}`, volume);
    },
updateAmbientVolume(key, path, targetVolume) {
        if (!this.unlocked || this.isPausedBySystem) return;

        if (targetVolume <= 0.0001 && !this.ambientSounds[key]) return;

        if (!this.ambientSounds[key]) {
            const audio = new Audio(`./assets/audio/sfx/${path}`);
            audio.loop = true;
            audio.volume = 0;
            this.ambientSounds[key] = audio;
        }

        const sound = this.ambientSounds[key];
        
        // Сначала плавно меняем громкость
        sound.volume += (targetVolume - sound.volume) * 0.05;

        // Если звук затих почти до нуля, только тогда ставим на паузу (чтобы не жрал ресурсы)
        if (sound.volume <= 0.001 && targetVolume <= 0.0001) {
            if (!sound.paused) sound.pause();
            sound.volume = 0;
        } else {
            // Иначе продолжаем играть
            if (sound.paused) sound.play().catch(() => {});
        }
    },
    pauseAll() {
        this.isPausedBySystem = true;
        // Паузим музыку
        if (this.currentMusic && !this.currentMusic.paused) this.currentMusic.pause();
        if (this.nextMusic && !this.nextMusic.paused) this.nextMusic.pause();
        // Паузим амбиент
        Object.values(this.ambientSounds).forEach(sound => {
            if (!sound.paused) sound.pause();
        });
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
    },

    resumeAll() {
        if (!this.unlocked) return;
        this.isPausedBySystem = false;
        // Возвращаем музыку
        if (this.currentMusic && this.currentMusic.paused) this.safePlay(this.currentMusic);
        if (this.nextMusic && this.nextMusic.paused) this.safePlay(this.nextMusic);
        // Возвращаем амбиент, у которого целевая громкость выше нуля
        // (musicController сам всё актуализирует при следующем тике update)
    },

    stopAllAmbient() {
        Object.values(this.ambientSounds).forEach(s => {
            s.pause();
            s.currentTime = 0;
        });
        // Полностью очищаем объект, чтобы при выходе всё забылось
        this.ambientSounds = {}; 
        this.currentUnderwaterKey = null;
    },

    stopEverything() {
        this.stopMusic();
        this.stopAllAmbient();
        this.isPausedBySystem = false;
    }
};
