// CubeBoss.js
import { CONFIG } from "../../config.js";
import { world } from "../../world/world.js";
import { Boss } from "../Boss.js";

export class CubeBoss extends Boss {
  constructor(x) {
    super({
      x,
      y: world.getGroundY(x),
      hp: 10
    });

    // =====================
    // 📦 ВНЕШНИЙ ВИД
    // =====================
    this.size = 90;
    this.color = "#666";

    // =====================
    // ⚙️ ФИЗИКА
    // =====================
    this.velocityX = 0;
    this.velocityY = 0;
    this.onGround = true;
    this.gravity = CONFIG.gravity;

    // =====================
    // 🧠 ПОВЕДЕНИЕ
    // =====================
    this.wakeUpDistance = 220;

    // базовые значения
    this.baseJumpPower = 13;
    this.baseMovePower = 3;

    // лимиты
    this.maxJumpPower = 18;   // ⬅️ лимит высоты прыжка
    this.maxMovePower = 5;    // ⬅️ лимит скорости

    this.jumpPower = this.baseJumpPower;
    this.movePower = this.baseMovePower;

    // =====================
    // 🦘 ПРЫЖКИ
    // =====================
    this.maxJumps = 6;
    this.jumpsLeft = this.maxJumps;

    this.jumpDelay = 65;      // ⬅️ МЕДЛЕННЕ прыгает
    this.jumpCooldown = 0;

    // =====================
    // 😮‍💨 УСТАЛОСТЬ
    // =====================
    this.tiredTime = 200;     // ⬅️ ДОЛЬШЕ устает
    this.tiredTimer = 0;

    // =====================
    // 🚦 СОСТОЯНИЯ
    // =====================
    this.isAwake = false;
    this.isTired = false;
    this.isVulnerable = false;

    // =====================
    // 😡 ЭСКАЛАЦИЯ
    // =====================
    this.rageStep = 0.6;
  }

  // =================================================
  // 🔁 UPDATE
  // =================================================
  update(player) {
    // ===== гравитация =====
    this.velocityY += this.gravity;
    this.x += this.velocityX;
    this.y += this.velocityY;

    // ===== земля =====
    const groundY = world.getGroundY(this.x);
    if (this.y >= groundY) {
      this.y = groundY;
      this.velocityY = 0;
      this.velocityX = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // ===== 😴 пробуждение =====
    const dist = Math.abs(player.x - this.x);
    if (!this.isAwake && dist < this.wakeUpDistance) {
      this.isAwake = true;
    }
    if (!this.isAwake) return;

    // ===== 😮‍💨 устал =====
    if (this.isTired) {
      this.tiredTimer++;

      if (this.tiredTimer >= this.tiredTime) {
        this.isTired = false;
        this.isVulnerable = false;
        this.tiredTimer = 0;
        this.jumpsLeft = this.maxJumps;

        this.increaseRage();
      }
      return;
    }

    // ===== ⏱ задержка =====
    if (this.jumpCooldown > 0) {
      this.jumpCooldown--;
      return;
    }

    // ===== 🦘 прыжок =====
    if (this.onGround && this.jumpsLeft > 0) {
      this.jumpAtPlayer(player);
      this.jumpsLeft--;
      this.jumpCooldown = this.jumpDelay;

      if (this.jumpsLeft === 0) {
        this.isTired = true;
        this.isVulnerable = true;
      }
    }
  }

  // =================================================
  // 🦘 ПРЫЖОК НА ИГРОКА
  // =================================================
  jumpAtPlayer(player) {
    const dir = Math.sign(player.x - this.x) || 1;

    this.velocityY = -this.jumpPower;
    this.velocityX = dir * this.movePower;
  }

  // =================================================
  // 😡 УСИЛЕНИЕ (С ЛИМИТАМИ)
  // =================================================
  increaseRage() {
    this.jumpPower = Math.min(
      this.jumpPower + this.rageStep,
      this.maxJumpPower
    );

    this.movePower = Math.min(
      this.movePower + this.rageStep,
      this.maxMovePower
    );
  }

  // =================================================
  // 💥 УРОН
  // =================================================
  takeDamage() {
    if (!this.isVulnerable) return;

    this.hp--;

    if (this.hp <= 0) {
      this.isAlive = false;
    }
  }

  // =================================================
  // 🎨 ОТРИСОВКА (ХП БАР)
  // =================================================
  draw(ctx) {
    if (!this.isAlive) return;

    const barWidth = 80;
    const barHeight = 8;
    const hpPercent = this.hp / 10;

    const x = this.x - barWidth / 2;
    const y = this.y - this.size - 18;

    ctx.fillStyle = "#300";
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = hpPercent < 0.3 ? "#e33" : "#6f0";
    ctx.fillRect(x, y, barWidth * hpPercent, barHeight);

    ctx.strokeStyle = "#000";
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

}
