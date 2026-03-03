/*NPC.js */
import { world } from "../../world/world.js";

export class NPC {
  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
    this.size = 26; 
    this.active = false;

    this.speed = 25;
    this.direction = 1;
    this.wanderTimer = 0;
    this.wanderInterval = 2;
    this.isPlayerNear = false;
    this.interactionRadius = 80;

    this.walkTime = 0;
    this.squashX = 1;
    this.squashY = 1;
    
    this.name = "NPC";
    this.goods = [];
  }

  spawnNearPlayer(player, distance = 150) {
    const offset = distance * (Math.random() < 0.5 ? -1 : 1);
    this.x = player.x + offset;
    this.y = world.getHeight(this.x) + this.size;
    
    this.direction = offset > 0 ? -1 : 1; 
    this.active = true;
  }

  update(player, dt) {
    if (!this.active) return;

    const dx = player.x - this.x;
    this.isPlayerNear = Math.abs(dx) < this.interactionRadius;

    if (!this.isPlayerNear) {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        const rand = Math.random();
        if (rand < 0.4) this.direction = -1;
        else if (rand < 0.8) this.direction = 1;
        else this.direction = 0;
        this.wanderTimer = this.wanderInterval + Math.random() * 2;
      }
      this.x += this.direction * this.speed * dt;
    } else {
      this.direction = dx > 0 ? 1 : -1;
    }

    this.y = world.getHeight(this.x) + this.size;

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
}