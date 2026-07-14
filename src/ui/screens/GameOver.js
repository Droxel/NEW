//GameOver.js
import { player } from "../../entities/player/Player.js";

export const gameOver = {
    isShown: false,
    playerRef: null, // Ссылка на игрока запишется при инициализации

    // Инициализируем один раз при старте игры
    init(playerInstance) {
        if (playerInstance) this.playerRef = playerInstance;

        const respawnBtn = document.getElementById("btn-respawn");
        const menuBtn = document.getElementById("btn-to-menu");

        if (respawnBtn) {
            respawnBtn.onclick = () => {
                console.log("Нажата кнопка возрождения");
                this.restart();
            };
        }

        if (menuBtn) {
            menuBtn.onclick = () => {
                location.reload(); 
            };
        }
    },

    // Метод update теперь принимает игрока, если ссылка не была сохранена ранее
    update(player) {
        const p = player || this.playerRef;
        if (p && p.hp <= 0 && !this.isShown) {
            this.show(p);
        }
    },

    show(player) {
        if (player) this.playerRef = player;
        this.isShown = true;
        const overlay = document.getElementById("game-over-screen");
        if (overlay) {
            overlay.style.display = "flex";
            // Передаем игрока в init на случай, если кнопки пересоздаются
            this.init(this.playerRef); 
        }
    },

    restart() {
        if (!this.playerRef) {
            console.error("Не удалось возродить игрока: ссылка на player отсутствует.");
            return;
        }

        // Восстанавливаем игрока через его родной метод spawn
        this.playerRef.spawn(100); 

        // Восстанавливаем характеристики безопасности
        this.playerRef.hp = this.playerRef.maxHp; 
        this.playerRef.air = this.playerRef.maxAir; 
        this.playerRef.invulnerableTimer = 120; // 2 секунды неуязвимости

        this.isShown = false;
        const overlay = document.getElementById("game-over-screen");
        if (overlay) overlay.style.display = "none";
        
        console.log("Игрок возрожден!");
    }
};

window.restartGame = () => gameOver.restart();