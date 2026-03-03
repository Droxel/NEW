/* /GlassesMerchant.js */
import { NPC } from "./NPC.js";
import { cameraX, cameraY } from "../../core/braw.js"; 

export class GlassesMerchant extends NPC {
  constructor() {
    super();
    this.name = "Optic Master";
    this.size = 26;
    
    this.goods = [
        { name: "Gold", price: 10, color: "#FFD700" },
        { name: "Blue", price: 20, color: "#00A6FF" },
        { name: "Cyber", price: 50, color: "#FF0055" }
    ];
  }

  draw(ctx, player) {
    if (!this.active) return;

   
    const centerX = this.x - cameraX + this.size / 2;
    const centerY = this.y - cameraY - this.size / 2;

    ctx.save();
    
    ctx.translate(centerX, centerY);
    
    ctx.scale(this.squashX * this.direction, this.squashY);

    
    const half = this.size / 2; 

    ctx.fillStyle = "#2a5eff"; 
    this.roundRect(ctx, -half, -half, this.size, this.size, 6);
    
    ctx.strokeStyle = "#1a3cb3";
    ctx.lineWidth = 2;
    ctx.stroke();

    const glassY = -2; 
    
    ctx.fillStyle = "#00d0ff";
    this.roundRect(ctx, -10, glassY, 9, 7, 2);
    ctx.strokeStyle = "#FFD700"; 
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-10, glassY, 9, 7);

    ctx.fillStyle = "#00d0ff";
    this.roundRect(ctx, 1, glassY, 9, 7, 2);
    ctx.strokeStyle = "#FFD700";
    ctx.strokeRect(1, glassY, 9, 7);

    ctx.fillStyle = "#FFD700";
    ctx.fillRect(-1, glassY + 2, 2, 1);

    
    const dx = (player.x - this.x) * this.direction; 
    const dy = player.y - this.y;
    
    const lookX = Math.max(-2, Math.min(2, dx / 50));
    const lookY = Math.max(-1, Math.min(1, dy / 50));

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(-5.5 + lookX, glassY + 3.5 + lookY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(5.5 + lookX, glassY + 3.5 + lookY, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.globalAlpha = 0.6;
    ctx.fillRect(-9, glassY + 1, 3, 2);
    ctx.fillRect(2, glassY + 1, 3, 2);
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = "#1a3cb3"; 
    ctx.fillRect(-6, half, 4, 3);
    ctx.fillRect(2, half, 4, 3);  

    ctx.restore();
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }
}