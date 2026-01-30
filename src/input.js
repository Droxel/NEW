/* input.js */
import { merchant } from "./merchant.js";
import { merchantUI } from "./merchant_ui.js";
import { cameraX, cameraY } from "./braw.js";

export let moveLeft = false;
export let moveRight = false;

export function setupInput(player) {

  // =====================
  // ⌨️ КЛАВИАТУРА
  // =====================
  document.addEventListener("keydown", e => {
    if (e.code === "KeyA") moveLeft = true;
    if (e.code === "KeyD") moveRight = true;
    if (e.code === "Space") player.jump();
  });

  document.addEventListener("keyup", e => {
    if (e.code === "KeyA") moveLeft = false;
    if (e.code === "KeyD") moveRight = false;
  });

  // =====================
  // 📱 МОБИЛЬНЫЕ КНОПКИ
  // =====================
  const leftBtn  = document.getElementById("left");
  const rightBtn = document.getElementById("right");
  const jumpBtn  = document.getElementById("jump");

  if (leftBtn && rightBtn && jumpBtn) {

    // ⬅️ влево
    leftBtn.addEventListener("touchstart", e => {
      e.preventDefault();
      moveLeft = true;
    });
    leftBtn.addEventListener("touchend", () => {
      moveLeft = false;
    });

    // ➡️ вправо
    rightBtn.addEventListener("touchstart", e => {
      e.preventDefault();
      moveRight = true;
    });
    rightBtn.addEventListener("touchend", () => {
      moveRight = false;
    });

    // ⬆️ прыжок
    jumpBtn.addEventListener("touchstart", e => {
      e.preventDefault();
      player.jump();
    });
  }

  // =====================
  // 🖱 / 📱 КЛИК ПО КАНВАСУ
  // =====================
  const canvas = document.getElementById("game");

  function handlePointer(x, y) {
    const mx = x + cameraX;
    const my = y + cameraY;

    // 🟪 торговец
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

    merchantUI.click(x, y);
  }

  // 🖱 мышь
  canvas.addEventListener("click", e => {
    handlePointer(e.offsetX, e.offsetY);
  });

  // 📱 палец
  canvas.addEventListener("touchstart", e => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    handlePointer(x, y);
  });
}
