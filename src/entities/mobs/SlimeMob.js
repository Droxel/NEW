// src/entities/mobs/SlimeMob.js
import { Mob } from "./Mob.js";
import { cameraX, cameraY } from "../../core/braw.js";

export class CubeSlime extends Mob {
  constructor(x, y, isNightMob = false) {
    super(x, y);
    
    this.isNightMob = isNightMob;

    if (this.isNightMob) {
      this.color = "#4a8a2a"; 
      this.innerColor = "#6ac43b";
      this.eyeColor = "#ffcc00"; 
      this.hp = 2;
      this.jumpPower = -12;
      this.aggroRange = 600;
    } else {
      this.color = "#888888"; 
      this.innerColor = "#aaaaaa"; 
      this.eyeColor = "white"; 
      this.hp = 1;
      this.jumpPower = -9;
      this.aggroRange = 400;
    }
    
    this.maxHp = this.hp;
    this.jumpTimer = 0;
    this.jumpInterval = 100 + Math.random() * 50;
    this.lookDir = 1; 
  }

  update(dt, player, allMobs) {
    super.update(dt, player, allMobs); // ИСПРАВЛЕНО: Передаем allMobs!

    const dx = player.x - this.x;
    if (Math.abs(dx) > 10) { 
        this.lookDir = Math.sign(dx);
    }

    if (this.onGround) {
      this.jumpTimer++;
      const dist = Math.abs(dx);

      if (this.jumpTimer > this.jumpInterval && dist < this.aggroRange) {
        this.velocityY = this.jumpPower;
        this.velocityX = this.lookDir * (this.isNightMob ? 4 : 2.5);
        this.jumpTimer = 0;
      }
    }
  }

draw(ctx) {
    // 1. УБРАЛИ "- cameraX" (теперь рисуем в мировых координатах)
    const drawX = this.x; 
    
    let bounce = 0;
    if (this.onGround) {
        bounce = Math.sin(this.animTime) * 2; 
    }

    let stretchY = 0;
    let stretchX = 0;
    if (!this.onGround) {
        stretchY = 4;  
        stretchX = -2; 
    } else {
        stretchY = -bounce; 
        stretchX = bounce;
    }

    const finalW = this.width + stretchX;
    const finalH = this.height + stretchY;
    
    // 2. УБРАЛИ "- cameraY" в конце формулы
    const drawY = (this.y + this.height) - finalH; 

    ctx.globalAlpha = 0.8;
    ctx.fillStyle = this.color;
    ctx.fillRect(drawX - stretchX/2, drawY, finalW, finalH);
    
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = this.innerColor;
    const border = 4;
    ctx.fillRect(drawX - stretchX/2 + border, drawY + border, finalW - border*2, finalH - border*2);

    ctx.fillStyle = this.eyeColor;
    const eyeOffset = this.lookDir === 1 ? 4 : -4; 
    
    ctx.fillRect(drawX + finalW/2 - 8 + eyeOffset, drawY + 8, 4, 4);
    ctx.fillRect(drawX + finalW/2 + 4 + eyeOffset, drawY + 8, 4, 4);

    if (this.isNightMob) {
       ctx.fillStyle = "black";
       ctx.fillRect(drawX + finalW/2 - 8 + eyeOffset, drawY + 6, 5, 2);
       ctx.fillRect(drawX + finalW/2 + 4 + eyeOffset, drawY + 6, 5, 2);
    }
    
    ctx.globalAlpha = 1.0;
  }
}