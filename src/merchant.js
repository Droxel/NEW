// merchant.js
import { world } from "./world/world.js";

export const merchant = {
  active: false,
  x: 0,
  y: 0,
  size: 26,

  // движение
  speed: 25,
  direction: 1,

  // NPC-поведение
  wanderTimer: 0,
  wanderInterval: 2,

  // игрок рядом?
  isPlayerNear: false,

  // анимация
  walkTime: 0,
  squashX: 1,
  squashY: 1,

goods: [
  { color: "#ff4d4d", name: "Красный" },
  { color: "#4dff4d", name: "Зелёный" },
  { color: "#4d4dff", name: "Синий" },
  { color: "#ffd84d", name: "Жёлтый" },
  { color: "#000000", name: "Чёрный" } // 🖤 новый цвет
],


  spawnNearPlayer(player) {
    if (this.active) return;

    const offset = 120 * (Math.random() < 0.5 ? -1 : 1);
    this.x = player.x + offset;
    this.y = world.getGroundY(this.x) + this.size;

    this.direction = Math.random() < 0.5 ? -1 : 1;
    this.wanderTimer = Math.random() * this.wanderInterval;

    this.active = true;
  },

  update(player, dt) {
    if (!this.active) return;

    // дистанция до игрока
    const dx = player.x - this.x;
    this.isPlayerNear = Math.abs(dx) < 80;

    // если игрок рядом — стоим
    if (!this.isPlayerNear) {
      this.wanderTimer -= dt;

      if (this.wanderTimer <= 0) {
        if (Math.random() < 0.6) {
          this.direction = Math.random() < 0.5 ? -1 : 1;
        } else {
          this.direction = 0;
        }

        this.wanderTimer = this.wanderInterval + Math.random() * 2;
      }

      this.x += this.direction * this.speed * dt;
    }

    // всегда на земле
    this.y = world.getGroundY(this.x) + this.size;

    // ─── АНИМАЦИЯ ───
    if (this.direction !== 0 && !this.isPlayerNear) {
      this.walkTime += dt * 16;
      const s = Math.sin(this.walkTime);
      this.squashX = 1 + s * 0.06;
      this.squashY = 1 - s * 0.08;
    } else {
      this.squashX += (1 - this.squashX) * 0.2;
      this.squashY += (1 - this.squashY) * 0.2;
    }
  }
};
