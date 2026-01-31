/* player.js */
import { CONFIG } from "./config.js";
import { world } from "./world/world.js";


export const player = {
  // ======================
// 🔄 ВРАЩЕНИЕ (GEOMETRY DASH)
// ======================
rotation: 0,          // текущий угол (в радианах)
rotationSpeed: 0,     // скорость вращения
rotationDir: 0, // -1 влево, 1 вправо, 0 нет вращения

  // ======================
  // 🧊 ПОЗИЦИЯ И РАЗМЕР
  // ======================
  x: 100,
  y: CONFIG.groundY,
  size: 30,

  // 🎨 ЦВЕТ КУБИКА (ДЛЯ ТОРГОВЛИ)
  color: "#000000",

  // ======================
  // 🏃 ФИЗИКА
  // ======================
  velocityX: 0,
  velocityY: 0,
  onGround: true,

  // ======================
  // 👀 НАПРАВЛЕНИЕ И ВЗГЛЯД
  // ======================
  direction: 0,
  lookX: 0,
  targetLookX: 0,

  // ======================
  // 🧊 АНИМАЦИЯ ФОРМЫ
  // ======================
  scaleX: 1,
  scaleY: 1,

  // ======================
  // 👁 МОРГАНИЕ
  // ======================
  blink: 0,
  blinkTimer: 0,
  justLanded: false,

  // ======================
  // ⬆️ ПРЫЖОК
  // ======================
jump() {
  if (this.onGround) {
    this.velocityY = -CONFIG.jumpPower;
    this.onGround = false;

    // 👉 если стоим на месте — не крутимся
    if (this.velocityX === 0) {
      this.rotationSpeed = 0;
      this.rotationDir = 0;
      return;
    }

    // 👉 если движемся — крутимся в сторону движения
    this.rotationDir = Math.sign(this.velocityX); // -1 или 1
    this.rotationSpeed = 0.25;
  }
},

  // ======================
  // 🔄 ОБНОВЛЕНИЕ
  // ======================
  update() {
  // ⬅️➡️ движение
  this.x += this.velocityX;

  // ⬇️ гравитация
  this.velocityY += CONFIG.gravity;
  this.y += this.velocityY;

  // 🌍 ЗЕМЛЯ
  const groundY = world.getGroundY(this.x);

  if (this.y >= groundY) {
    if (!this.onGround) this.justLanded = true;

    this.y = groundY;
    this.velocityY = 0;
    this.onGround = true;
  } else {
    this.onGround = false;
  }

  // 👀 взгляд
  this.lookX += (this.targetLookX - this.lookX) * 0.15;

  // 🧊 squash & stretch
  if (!this.onGround) {
    this.scaleY += (1.15 - this.scaleY) * 0.2;
    this.scaleX += (0.9 - this.scaleX) * 0.2;
  } else {
    this.scaleX += (1 - this.scaleX) * 0.25;
    this.scaleY += (1 - this.scaleY) * 0.25;
  }

  // 👁 моргание
  this.blinkTimer++;
  if (this.blinkTimer > 180 && Math.random() < 0.02) {
    this.blink = 1;
    this.blinkTimer = 0;
  }
  this.blink += (0 - this.blink) * 0.2;

  // ======================
// 🔄 ВРАЩЕНИЕ КУБИКА
// ======================
if (!this.onGround && this.rotationDir !== 0) {
  this.rotation += this.rotationSpeed * this.rotationDir;

} else if (this.onGround) {
  // идеально выравниваемся после прыжка
  const snapped =
    Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);

  this.rotation += (snapped - this.rotation) * 0.3;

  // почти выровнялись — стоп
  if (Math.abs(this.rotation - snapped) < 0.001) {
    this.rotation = snapped;
    this.rotationSpeed = 0;
    this.rotationDir = 0;
  }
}
  }
};