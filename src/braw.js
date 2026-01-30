/* braw.js */
import { CONFIG } from "./config.js";

// 🌲 картинки
const treeImg = new Image();
treeImg.src = "./assets/tree2.svg";

// 🎥 камера (ЖИВЁТ МЕЖДУ КАДРАМИ)
let cameraX = 0;
let cameraY = 0;

export function draw(ctx, player, world, time) {

  // =========================
  // 🎥 КАМЕРА СЛЕДУЕТ ЗА ИГРОКОМ
  // =========================
  const targetCameraX = player.x - CONFIG.width / 2;
  const targetCameraY = player.y - CONFIG.height / 2;

  cameraX += (targetCameraX - cameraX) * 0.1;
  cameraY += (targetCameraY - cameraY) * 0.1;

  // =========================
  // 🌗 НОЧЬ / ДЕНЬ
  // =========================
  const night = time.getNightFactor();

  function mix(a, b, t) {
    return Math.floor(a + (b - a) * t);
  }

  const dayTop = [80, 180, 255];
  const dayBottom = [170, 220, 255];
  const nightTop = [10, 10, 40];
  const nightBottom = [0, 0, 20];

  const topColor = `rgb(
    ${mix(dayTop[0], nightTop[0], night)},
    ${mix(dayTop[1], nightTop[1], night)},
    ${mix(dayTop[2], nightTop[2], night)}
  )`;

  const bottomColor = `rgb(
    ${mix(dayBottom[0], nightBottom[0], night)},
    ${mix(dayBottom[1], nightBottom[1], night)},
    ${mix(dayBottom[2], nightBottom[2], night)}
  )`;

  const sky = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
  sky.addColorStop(0, topColor);
  sky.addColorStop(1, bottomColor);

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  // =========================
  // ☀️ СОЛНЦЕ / 🌙 ЛУНА
  // =========================
  function smooth(t) {
    return t * t * (3 - 2 * t);
  }

  const current = time.current;
  const isDay = current < time.dayLength;

  if (isDay) {
    const t = current / time.dayLength;
    const x = CONFIG.width * t;
    const y = 80 - Math.sin(t * Math.PI) * 50;

    let alpha = 1;
    if (t < 0.1) alpha = smooth(t / 0.1);
    if (t > 0.9) alpha = smooth((1 - t) / 0.1);

    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,230,100,${alpha})`;
    ctx.fill();
  } else {
    const t = (current - time.dayLength) / time.nightLength;
    const x = CONFIG.width * t;
    const y = 80 - Math.sin(t * Math.PI) * 50;

    let alpha = 1;
    if (t < 0.1) alpha = smooth(t / 0.1);
    if (t > 0.9) alpha = smooth((1 - t) / 0.1);

    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,220,255,${alpha})`;
    ctx.fill();
  }

  // =========================
  // 🌍 МИР (КАМЕРА)
  // =========================
  ctx.save();
  ctx.translate(-cameraX, -cameraY);

  // =========================
  // 🌲 ДЕРЕВЬЯ
  // =========================
// =========================
// 🌲 ДЕРЕВЬЯ (УТОПЛЕНЫ В ЗЕМЛЮ)
// =========================
world.trees.forEach(tree => {

  // насколько дерево уходит в землю
  const bury = 6; // ← можешь играться: 4–10

  const x = tree.x;
  const y =
    tree.y - tree.height + player.size + bury;

  if (treeImg.complete) {
    ctx.drawImage(
      treeImg,
      x,
      y,
      tree.width,
      tree.height
    );
  } else {
    ctx.fillStyle = "green";
    ctx.fillRect(x, y, tree.width, tree.height);
  }
});


  // =========================
  // 🌍 ЗЕМЛЯ
  // =========================
  ctx.fillStyle = "brown";

  for (
    let x = cameraX;
    x < cameraX + CONFIG.width;
    x++
  ) {
    const groundY = world.getGroundY(x);

    ctx.fillRect(
      x,
      groundY + player.size,
      1,
      CONFIG.height
    );
  }

  // =========================
  // 🟥 КУБИК
  // =========================
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  ctx.save();
  ctx.translate(
    player.x + player.size / 2,
    player.y + player.size / 2
  );
  ctx.scale(player.scaleX, player.scaleY);

  ctx.fillStyle = "black";
  roundRect(
    ctx,
    -player.size / 2,
    -player.size / 2,
    player.size,
    player.size,
    6
  );
  ctx.fill();
  ctx.restore();

  // 👀 глаза
  const eyeY = player.y + 10;
  const look = player.lookX;

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(player.x + 8, eyeY, 4, 0, Math.PI * 2);
  ctx.arc(player.x + player.size - 8, eyeY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(player.x + 8 + look, eyeY, 2, 0, Math.PI * 2);
  ctx.arc(player.x + player.size - 8 + look, eyeY, 2, 0, Math.PI * 2);
  ctx.fill();

  // =========================
  // 🎥 ВОЗВРАЩАЕМ КАМЕРУ
  // =========================
  ctx.restore();
}
