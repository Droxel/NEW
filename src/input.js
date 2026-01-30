/* input.js */
import { merchant } from "./merchant.js";
import { merchantUI } from "./merchant_ui.js";
import { cameraX, cameraY } from "./braw.js";

export let moveLeft = false;
export let moveRight = false;

export function setupInput(player) {

  // ⌨️ КЛАВИАТУРА
  document.addEventListener("keydown", e => {
    if (e.code === "KeyA") moveLeft = true;
    if (e.code === "KeyD") moveRight = true;
    if (e.code === "Space") player.jump();
  });

  document.addEventListener("keyup", e => {
    if (e.code === "KeyA") moveLeft = false;
    if (e.code === "KeyD") moveRight = false;
  });

  // 🖱 КЛИК ПО ТОРГОВЦУ И МЕНЮ
  const canvas = document.getElementById("game");

  canvas.addEventListener("click", e => {
    const mx = e.offsetX + cameraX;
    const my = e.offsetY + cameraY;

    // 🟪 клик по торговцу
    if (merchant.active && merchant.isPlayerNear) {
      if (
        mx > merchant.x &&
        mx < merchant.x + merchant.size &&
        my > merchant.y - merchant.size &&
        my < merchant.y
      ) {
        merchantUI.open = !merchantUI.open;
        return;
      }
    }

    // 🎨 клик по цветам
    merchantUI.click(e.offsetX, e.offsetY);
  });
}
