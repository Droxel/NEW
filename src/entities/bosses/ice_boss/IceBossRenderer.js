// entities/bosses/ice_boss/IceBossRenderer.js
import { assets } from "../../../core/AssetLoader.js";

export class IceBossRenderer {
    constructor(boss) {
        this.boss = boss;
    }

    updateTelegraphing() {
        const timeBefore = this.boss.timers.attack;
        const isCharging = timeBefore > 0 && timeBefore < 60;

        if (isCharging) {
            const attackType = this.boss.getNextAttackType();
            this.boss.targets.alpha = 0.4;

            switch(attackType) {
                case "sky_icicles": 
                    this.boss.targets.scaleX = 1.2;
                    this.boss.targets.scaleY = 1.2;
                    this.boss.targets.color = [66, 245, 227]; 
                    break;
                case "blocks": 
                    this.boss.targets.scaleX = 1.3;
                    this.boss.targets.scaleY = 0.8;
                    this.boss.targets.color = [0, 100, 255];
                    break;
                case "minigun": 
                    this.boss.targets.scaleX = 0.8;
                    this.boss.targets.scaleY = 1.4;
                    this.boss.targets.color = [255, 255, 200];
                    break;
                case "surround": 
                    const pulse = 1 + Math.sin(Date.now() / 100) * 0.2;
                    this.boss.targets.scaleX = pulse;
                    this.boss.targets.scaleY = pulse;
                    this.boss.targets.color = [255, 255, 255];
                    break;
            }
        } else {
            this.boss.targets.scaleX = 1.0;
            this.boss.targets.scaleY = 1.0;
            this.boss.targets.alpha = 0;
        }
    }

    drawHealthBar(ctx) {
        const w = 120; 
        const h = 6;  
        const barY = this.boss.y - this.boss.size - 60; 
        const barX = this.boss.x - w / 2;

        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(barX, barY, w, h);
        
        const pct = Math.max(0, this.boss.hp / this.boss.maxHp);
        ctx.fillStyle = pct > 0.5 ? "#42f5e3" : (pct > 0.2 ? "#f5a742" : "#f54242"); 
        ctx.fillRect(barX, barY, w * pct, h);
    }

    drawMainCrystal(ctx) {
        const floatY = Math.sin(Date.now() / 400) * 8; 
        const crystalY = this.boss.y - this.boss.size - 50 + floatY;

        ctx.save();
        ctx.translate(this.boss.x, crystalY);
        
        if (this.boss.anim.auraAlpha > 0.01) {
            const [r, g, b] = this.boss.targets.color;
            ctx.globalAlpha = this.boss.anim.auraAlpha;
            for(let i = 1; i <= 3; i++) {
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.1 / i})`;
                ctx.beginPath();
                ctx.arc(0, 0, 30 * i * this.boss.anim.crystalScaleX, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.scale(this.boss.anim.crystalScaleX, this.boss.anim.crystalScaleY);
        ctx.globalAlpha = this.boss.isInvulnerable ? 1.0 : 0.8;

        const crystalImg = assets.crystal_boss;
        if (crystalImg && crystalImg.complete) {
            ctx.drawImage(crystalImg, -25, -25, 50, 50);
        } else {
            ctx.fillStyle = `rgb(${this.boss.targets.color.join(',')})`;
            ctx.beginPath();
            ctx.moveTo(0, -25); ctx.lineTo(20, 0); ctx.lineTo(0, 25); ctx.lineTo(-20, 0);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
        ctx.globalAlpha = 1.0;
    }

    draw(ctx) {
        this.boss.clouds.forEach(c => c.draw(ctx));
        this.boss.projectiles.forEach(p => p.draw(ctx));

        if (!this.boss.isAlive) return;

        if (!this.boss.isInvulnerable) {
            this.drawHealthBar(ctx);
        }

        ctx.save();
        ctx.translate(this.boss.x, this.boss.y);
        ctx.scale(this.boss.scaleX, this.boss.scaleY);
        const bossImg = this.boss.isInvulnerable ? assets.ice_boss : assets.ice_boss2;
        if (bossImg && bossImg.complete) {
            ctx.drawImage(bossImg, -this.boss.size/2, -this.boss.size, this.boss.size, this.boss.size);
        } else {
            ctx.fillStyle = this.boss.isInvulnerable ? "#77ccff" : "#4499dd";
            ctx.fillRect(-this.boss.size/2, -this.boss.size, this.boss.size, this.boss.size);
        }
        ctx.restore();

        this.drawMainCrystal(ctx);
        this.boss.shields.forEach(s => s.draw(ctx));
    }
}