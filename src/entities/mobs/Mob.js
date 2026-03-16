// src/entities/mobs/Mob.js
import { CONFIG } from "../../data/config.js";
import { world } from "../../world/World.js";
import { cameraX, cameraY } from "../../core/Braw.js";
import { mobManager } from "./MobManager.js";

export class Mob {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.color = "gray";
    
    this.velocityX = 0;
    this.velocityY = 0;
    this.onGround = false;
    
    this.hp = 1;
    this.maxHp = 1;
    this.isDead = false;
    this.markedForDeletion = false;
    this.isInDungeon = true; 
    
    // ВЕРНУЛИ: Нужно для анимации слаймов
    this.animTime = Math.random() * 100; 
  }

  checkWallCollisions(axis) {
    if (!world.chunkManager) return;

    const chunkId = world.chunkManager.getChunkId(this.x);
    const chunk = world.chunkManager.chunks.get(chunkId);
    if (!chunk || !chunk.objects) return;

    for (let obj of chunk.objects) {
        const solidTypes = ["dungeon_wall", "dungeon_block", "village_wall", "wall", "stone"];
if (!solidTypes.includes(obj.type)) continue;
        if (
            this.x < obj.x + obj.width &&
            this.x + this.width > obj.x &&
            this.y < obj.y + obj.height &&
            this.y + this.height > obj.y 
        ) {
            if (axis === 'x') {
                if (this.velocityX > 0) {
                    this.x = obj.x - this.width;
                } else if (this.velocityX < 0) {
                    this.x = obj.x + obj.width;
                }
                this.velocityX *= -0.5; 
            }
            
            if (axis === 'y') {
                if (this.velocityY > 0) { 
                    this.y = obj.y - this.height; 
                    this.velocityY = 0;
                    this.onGround = true;
                } else if (this.velocityY < 0) { 
                    this.y = obj.y + obj.height;
                    this.velocityY = 0;
                }
            }
        }
    }
  }

  update(dt, player, allMobs) {
    if (this.isDead) return;

    this.animTime += 0.1; // ВЕРНУЛИ: Обновление таймера анимации

    if (allMobs) {
        allMobs.forEach(other => {
            if (other === this || other.isDead) return;
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.width && distance > 0) {
                this.velocityX += (dx / distance) * 0.2;
            }
        });
    }

    this.x += this.velocityX;
    this.velocityX *= 0.9;
    this.checkWallCollisions('x');

    this.velocityY += CONFIG.gravity;
    this.y += this.velocityY;
    
    this.onGround = false;
    this.checkWallCollisions('y'); 

// 1. Получаем высоту земли
    const groundY = world.getHeight(this.x);
    
    // 2. Опускаем "планку" приземления на 30 пикселей ниже
    const actualGround = groundY + 30; 
    
    // 3. Используем actualGround вместо groundY для физики
    if (!this.onGround && this.y + this.height > actualGround) {
        if (Math.abs(this.y - actualGround) < 500) {
            this.y = actualGround - this.height; // Моб встанет ногами на 30 пикселей ниже
            this.velocityY = 0;
            this.onGround = true;
        }
    }

    if (this.y > 35000) this.markedForDeletion = true;
}

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) this.die();
  }

  die() {
    this.isDead = true;
    this.markedForDeletion = true;
    mobManager.spawnUraniumParticle(this.x + this.width/2, this.y + this.height/2);
    if (Math.random() < 0.5) mobManager.spawnDrop(this.x, this.y); // Шанс дропа кристалла
  }

draw(ctx) {
    // УБРАЛИ - cameraX и - cameraY
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}