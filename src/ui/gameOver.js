// src/core/gameOver.js
import { player } from "../entities/player.js";

export const gameOver = {
    isShown: false,

    update() {
        // Если хп 0 и экран еще не показан
        if (player.hp <= 0 && !this.isShown) {
            console.log("Критическое состояние! HP:", player.hp);
            this.show();
        }
    },

    show() {
        this.isShown = true;
        const overlay = document.getElementById("game-over-screen");
        if (overlay) {
            overlay.style.display = "flex";
            console.log("Экран смерти отображен");
        } else {
            // Если ты забыл добавить ID в index.html, ты увидишь это в консоли
            console.error("ОШИБКА: Элемент 'game-over-screen' не найден в index.html!");
        }
    },

    restart() {
        player.hp = player.maxHp;
        player.invulnerableTimer = 60;
        player.x = 100;
        player.y = 100; // Немного поднимем при спавне
        player.velocityX = 0;
        player.velocityY = 0;

        this.isShown = false;
        const overlay = document.getElementById("game-over-screen");
        if (overlay) overlay.style.display = "none";
        
        console.log("Игра перезапущена!");
    }
};

window.restartGame = () => gameOver.restart();