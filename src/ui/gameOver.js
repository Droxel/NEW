// src/core/gameOver.js
import { player } from "../entities/player.js";

export const gameOver = {
    isShown: false,

    // Инициализация (вызови это один раз при старте или прямо в файле)
    init() {
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
                location.reload(); // Самый простой способ вернуться в меню
            };
        }
    },

    update() {
        if (player.hp <= 0 && !this.isShown) {
            this.show();
        }
    },

    show() {
        this.isShown = true;
        const overlay = document.getElementById("game-over-screen");
        if (overlay) {
            overlay.style.display = "flex";
            // Инициализируем кнопки, если еще не сделали этого
            this.init(); 
        }
    },

    restart() {
        // Восстанавливаем игрока
        player.hp = player.maxHp || 100;
        player.x = 100; // Координаты спавна
        player.y = 100;
        player.velocityX = 0;
        player.velocityY = 0;
        player.invulnerableTimer = 120; // 2 секунды неуязвимости

        this.isShown = false;
        const overlay = document.getElementById("game-over-screen");
        if (overlay) overlay.style.display = "none";
        
        console.log("Игрок возрожден!");
    }
};

window.restartGame = () => gameOver.restart();