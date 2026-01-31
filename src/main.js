// main.js
import { CONFIG } from "./config.js";
import { player } from "./player.js";
import { setupInput, moveLeft, moveRight } from "./input.js";
import { world } from "./world/world.js";
import { draw } from "./braw.js";
import { time } from "./time.js";
import { merchant } from "./merchant.js";
import { merchantUI } from "./merchant_ui.js";
import { bossManager } from "./bosses/BossManager.js";

console.log("WORLD:", world);

// canvas
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// создаём мир
world.init();
// 🧊 спавн босса
bossManager.spawn(player);

// спавн торговца
merchant.spawnNearPlayer(player);

// управление
setupInput(player);

// ⏱ время
let lastTime = performance.now();

function gameLoop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;
bossManager.update(player);

if (bossManager.boss) {
  bossManager.boss.draw(ctx);
}

  // день / ночь
  time.update(dt);

  // движение игрока
  player.velocityX = 0;

  if (moveLeft) {
    player.velocityX = -CONFIG.speed;
    player.direction = -1;
    player.targetLookX = -4;
  } else if (moveRight) {
    player.velocityX = CONFIG.speed;
    player.direction = 1;
    player.targetLookX = 4;
  } else {
    player.direction = 0;
    player.targetLookX = 0;
  }

  // обновление торговца
  merchant.update(player, dt);

  merchantUI.update(); // 👈 ВАЖНО

  // обновление игрока
  player.update();
  // 🧊 обновление босса
bossManager.update(player);
// 💥 удар по боссу сверху
  // Проверка и отрисовка HP

const boss = bossManager.boss;
if (
  boss &&
  boss.isAlive &&
  boss.isVulnerable &&
  player.velocityY > 0 && // игрок падает
  player.x + player.size > boss.x - boss.size / 2 &&
  player.x < boss.x + boss.size / 2 &&
  player.y + player.size >= boss.y - boss.size &&
  player.y + player.size <= boss.y
) {
  boss.takeDamage();
  player.velocityY = -8; // отскок
}

  // обновление мира
  world.update(player.x);

  // рендер мира
  draw(ctx, player, world, time, bossManager.boss);


  // рендер UI для торговца
  merchantUI.draw(ctx);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
