/* main.js */
import { CONFIG } from "./config.js";
import { player } from "./player.js";
import { setupInput, moveLeft, moveRight } from "./input.js";
import { world } from "./world.js";
import { draw } from "./braw.js";
import { time } from "./time.js";
import { merchant } from "./merchant.js";
import { merchantUI } from "./merchant_ui.js";
// canvas
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// создаём мир
world.init();

merchant.spawnNearPlayer(player);

// управление
setupInput(player);

// ⏱ время
let lastTime = performance.now();

function gameLoop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  // день / ночь
  time.update(dt);

  // движение
player.velocityX = 0;

if (moveLeft) {
  player.velocityX = -CONFIG.speed;
  player.direction = -1;
  player.targetLookX = -4;
}
else if (moveRight) {
  player.velocityX = CONFIG.speed;
  player.direction = 1;
  player.targetLookX = 4;
}
else {
  player.direction = 0;
  player.targetLookX = 0;
}

merchant.update(player, dt);

merchantUI.update(); // 👈 ВАЖНО
// обновление игрока
  player.update();
  
  // мир
  world.update(player.x);

  // рендер
  draw(ctx, player, world, time);

  merchantUI.draw(ctx);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
