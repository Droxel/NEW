/* braw.js */
import { CONFIG } from "./config.js";
import { merchant } from "./merchant.js";

// 🌲 картинки
const treeImg = new Image();
treeImg.src = "./assets/tree2.svg";
// ☁️ ОБЛАКА
const clouds = [];

for (let i = 0; i < 8; i++) {
  clouds.push({
    x: Math.random() * 2000 - 1000,
    y: 60 + Math.random() * 80,
    size: 40 + Math.random() * 50,
    speed: 5 + Math.random() * 10
  });
}
// ⭐ ЗВЁЗДЫ (СОЗДАЮТСЯ ОДИН РАЗ)
const stars = [];

for (let i = 0; i < 120; i++) {
  stars.push({
    x: Math.random() * CONFIG.width,
    y: Math.random() * (CONFIG.height * 0.5),
    r: Math.random() * 1.5 + 0.5,
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random()
  });
}

// 🎥 камера (ЖИВЁТ МЕЖДУ КАДРАМИ)
export let cameraX = 0;
export let cameraY = 0;


export function draw(ctx, player, world, time, boss) {


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
// ☁️ УТРЕННИЕ ОБЛАКА
// =========================
const morning = time.getMorningFactor();

if (morning > 0) {
  ctx.save();
  ctx.globalAlpha = 0.5 * morning;

  ctx.fillStyle = "white";

  clouds.forEach(c => {

    // движение
    c.x += c.speed * 0.02;
    if (c.x - c.size > CONFIG.width + 200) {
      c.x = -200;
    }

    // облако = 3 круга
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
    ctx.arc(c.x + c.size * 0.6, c.y + 10, c.size * 0.8, 0, Math.PI * 2);
    ctx.arc(c.x - c.size * 0.6, c.y + 10, c.size * 0.7, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}
// =========================
// ⭐ НОЧНЫЕ ЗВЁЗДЫ
// =========================
if (night > 0.2) {
  ctx.save();

  stars.forEach(s => {
    s.phase += s.speed * 0.02;

    // пульсация
    const pulse = (Math.sin(s.phase) + 1) / 2;

    ctx.globalAlpha = night * (0.3 + pulse * 0.7);

    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  });

  ctx.restore();
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
// 💧 ВОДА (ПО САМОМУ НИЗКОМУ БЕРЕГУ)
// =========================
/*ctx.fillStyle = "rgba(70,120,200,0.75)";

for (const w of world.water) {
  const leftX = Math.floor(w.left);
  const rightX = Math.ceil(w.right);
  const waterY = w.level;

  ctx.beginPath();

  // верх воды
  ctx.moveTo(leftX, waterY);
  ctx.lineTo(rightX, waterY);

  // дно воды = РЕАЛЬНАЯ ЗЕМЛЯ
  for (let x = rightX; x >= leftX; x--) {
    const y = Math.max(world.getGroundY(x), waterY);
    ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fill();
}
*/
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
ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
ctx.rotate(player.rotation);
ctx.scale(player.scaleX, player.scaleY);

// 🟥 куб
ctx.fillStyle = player.color;
roundRect(ctx, -player.size / 2, -player.size / 2, player.size, player.size, 6);
ctx.fill();

// 👀 глаза
const eyeY = -5;
const look = player.lookX;

ctx.fillStyle = "white";
ctx.beginPath();
ctx.arc(-7, eyeY, 4, 0, Math.PI * 2);
ctx.arc(7, eyeY, 4, 0, Math.PI * 2);
ctx.fill();

ctx.fillStyle = "black";
ctx.beginPath();
ctx.arc(-7 + look, eyeY, 2, 0, Math.PI * 2);
ctx.arc(7 + look, eyeY, 2, 0, Math.PI * 2);
ctx.fill();

ctx.restore();


// =========================
// 🟪 СТРАНСТВУЮЩИЙ КУБИК
// =========================
if (world && merchant?.active) {

  // === squash & stretch ===
  ctx.save();
  ctx.translate(
    merchant.x + merchant.size / 2,
    merchant.y - merchant.size / 2
  );
  ctx.scale(merchant.squashX, merchant.squashY);
  ctx.translate(
    -(merchant.x + merchant.size / 2),
    -(merchant.y - merchant.size / 2)
  );

  // === ТЕЛО ===
  ctx.fillStyle = "#7b4dff";
  roundedRect(
    merchant.x,
    merchant.y - merchant.size,
    merchant.size,
    merchant.size,
    8
  );
  ctx.fill();

  ctx.strokeStyle = "#3e2a9e";
  ctx.lineWidth = 2;
  ctx.stroke();

  // === ГЛАЗА ===
  const eyeY = merchant.y - merchant.size * 0.65;
  const eyeOffset = merchant.size * 0.25;

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(merchant.x + eyeOffset, eyeY, 4, 0, Math.PI * 2);
  ctx.arc(merchant.x + merchant.size - eyeOffset, eyeY, 4, 0, Math.PI * 2);
  ctx.fill();

  // --- взгляд на игрока ---
  const lookDX = player.x - (merchant.x + merchant.size / 2);
  const lookDY = player.y - merchant.y;
  const len = Math.hypot(lookDX, lookDY) || 1;

  const lookX = (lookDX / len) * 2;
  const lookY = (lookDY / len) * 2;

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(
    merchant.x + eyeOffset + lookX,
    eyeY + lookY,
    1.5,
    0,
    Math.PI * 2
  );
  ctx.arc(
    merchant.x + merchant.size - eyeOffset + lookX,
    eyeY + lookY,
    1.5,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // === ШЛЯПА ===
  ctx.fillStyle = "#5a2e0f";
  ctx.fillRect(
    merchant.x - 4,
    merchant.y - merchant.size - 6,
    merchant.size + 8,
    6
  );

  ctx.fillStyle = "#8B4513";
  roundedRect(
    merchant.x + 6,
    merchant.y - merchant.size - 26,
    merchant.size - 12,
    20,
    5
  );
  ctx.fill();

  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(
    merchant.x + 8,
    merchant.y - merchant.size - 18,
    merchant.size - 16,
    4
  );

  ctx.restore();
}


// === helper ===
function roundedRect(x, y, w, h, r) {
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


// =========================
// 🧊 БОСС-КУБ (УЛУЧШЕННЫЙ ВИЗУАЛ)
// =========================
if (boss && boss.isAlive) {
  ctx.save();

  const size = boss.size;
  const x = boss.x - size / 2;
  const y = boss.y - size;
  const radius = 14;

  // =========================
  // 🔴 ТЕЛО (СКРУГЛЁННОЕ)
  // =========================
  ctx.fillStyle = boss.isVulnerable ? "#b22222" : "#555";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.fill();

  ctx.shadowBlur = 0;

  // =========================
  // 👿 ГЛАЗА
  // =========================
  const eyeY = y + size * 0.35;
  const eyeOffset = size * 0.22;

  // белки
  ctx.fillStyle = "#eee";
  ctx.beginPath();
  ctx.ellipse(boss.x - eyeOffset, eyeY, 7, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(boss.x + eyeOffset, eyeY, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // зрачки
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(boss.x - eyeOffset + 2, eyeY, 3, 0, Math.PI * 2);
  ctx.arc(boss.x + eyeOffset - 2, eyeY, 3, 0, Math.PI * 2);
  ctx.fill();

  // =========================
  // 😠 БРОВИ
  // =========================
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(boss.x - eyeOffset - 10, eyeY - 10);
  ctx.lineTo(boss.x - eyeOffset + 6, eyeY - 6);

  ctx.moveTo(boss.x + eyeOffset + 10, eyeY - 10);
  ctx.lineTo(boss.x + eyeOffset - 6, eyeY - 6);
  ctx.stroke();

  // =========================
  // 😬 РОТ (ЗЛОЙ)
  // =========================
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(boss.x - 18, y + size * 0.65);
  ctx.lineTo(boss.x + 18, y + size * 0.65);
  ctx.stroke();

  // =========================
  // ❤️ ХП БАР
  // =========================
  const barWidth = 90;
  const barHeight = 8;
  const hpPercent = boss.hp / boss.maxHp;

  const bx = boss.x - barWidth / 2;
  const by = y - 14;

  ctx.fillStyle = "#300";
  ctx.fillRect(bx, by, barWidth, barHeight);

  ctx.fillStyle = hpPercent < 0.3 ? "#e33" : "#6f0";
  ctx.fillRect(bx, by, barWidth * hpPercent, barHeight);

  ctx.strokeStyle = "#000";
  ctx.strokeRect(bx, by, barWidth, barHeight);

  ctx.restore();
}


  // ========================
  // 🎥 ВОЗВРАЩАЕМ КАМЕРУ
  // =========================
  ctx.restore();
}
