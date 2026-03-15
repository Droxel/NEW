//UIManager.js
import { player } from "../entities/player/Player.js";
export const ui = {
  update() {
    const healthContainer = document.getElementById("health-ui");
    if (!healthContainer) return;

    const currentHearts = healthContainer.children.length;
    
    if (currentHearts !== player.maxHp) {
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
  }
};