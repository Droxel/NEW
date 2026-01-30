/* player.js */
import { CONFIG } from "./config.js";
import { world } from "./world.js";


export const player = {
  x: 100,
  y: CONFIG.groundY,
  size: 30,

  velocityX: 0,
  velocityY: 0,
  onGround: true,

  direction: 0,
  lookX: 0,
  targetLookX: 0,

  scaleX: 1,
  scaleY: 1,

  blink: 0,
  blinkTimer: 0,
  justLanded: false,

  jump() {
    if (this.onGround) {
      this.velocityY = -CONFIG.jumpPower;
      this.onGround = false;
    }
  },

  update() {
    // ⬅️➡️ движение
    this.x += this.velocityX;

    // ⬇️ гравитация
    this.velocityY += CONFIG.gravity;
    this.y += this.velocityY;

    // ======================
    // 🌍 ЗЕМЛЯ (БЕЗ КАМНЕЙ)
    // ======================
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
  }
};
