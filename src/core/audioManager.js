// src/core/audioManager.js
export const audioManager = {
    currentMusic: null,
    unlocked: false,

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
    }
};