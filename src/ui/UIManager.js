// src/ui/UIManager.js
import { player } from "../entities/player/Player.js";

export const ui = {
    update() {
        this.updateHealth();
        this.updateAir();
    },

    updateHealth() {
        const healthContainer = document.getElementById("health-ui");
        if (!healthContainer) return;

        if (healthContainer.children.length !== player.maxHp) {
            healthContainer.innerHTML = "";
            for (let i = 0; i < player.maxHp; i++) {
                const heart = document.createElement("div");
                heart.className = "heart";
                healthContainer.appendChild(heart);
            }
        }

        const hearts = healthContainer.children;
        for (let i = 0; i < hearts.length; i++) {
            if (i < player.hp) {
                hearts[i].classList.remove("empty");
            } else {
                hearts[i].classList.add("empty");
            }
        }
    },

updateAir() {
    const airContainer = document.getElementById("air-ui");
    if (!airContainer) return;

    // Показываем, только если воздуха не максимум
    if (player.air < player.maxAir) {
        airContainer.style.display = "flex";

        // Создаем 10 пузырьков, если их нет
        if (airContainer.children.length !== player.maxAir) {
            airContainer.innerHTML = "";
            for (let i = 0; i < player.maxAir; i++) {
                const bubble = document.createElement("div");
                bubble.className = "bubble-ui";
                airContainer.appendChild(bubble);
            }
        }

        const bubbles = airContainer.children;
        for (let i = 0; i < bubbles.length; i++) {
            // Пузырьки исчезают по порядку: 
            // Если индекс пузырька больше или равен текущему запасу — он лопается
            if (i >= player.air) {
                if (!bubbles[i].classList.contains("pop")) {
                    bubbles[i].classList.add("pop");
                    setTimeout(() => { 
                        if (bubbles[i]) bubbles[i].style.visibility = "hidden"; 
                    }, 200);
                }
            } else {
                bubbles[i].classList.remove("pop");
                bubbles[i].style.visibility = "visible";
                bubbles[i].style.opacity = "1";
            }
        }
    } else {
        airContainer.style.display = "none";
    }
}
};