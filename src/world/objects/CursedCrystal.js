/* src/world/objects/CursedCrystal.js */
import { world } from "../World.js";

export class CursedCrystal {
    constructor(x, y) {
        this.type = "cursed_crystal";
        this.x = x;
        this.y = y;
        this.w = 50; 
        this.h = 50;
        this.imgKey = "cursed_crystal"; 
        
        // Настройки эффекта
        this.effectRadius = 1800; // Радиус ауры ускорения
        
        // Физика катания (Тяжелый вес)
        this.velocityX = 0;
        this.velocityY = 0;
        this.friction = 0.92; 
        this.bounce = 0.2;    
        this.rotation = 0;

        // Интеграция в систему динамического света
        this.light = {
            x: this.x + this.w / 2,
            y: this.y + this.h / 2,
            radius: this.effectRadius,
            intensity: 0.9,
            isCursedCrystal: true 
        };
    }

    update(dt, player) {
        const actualPlayer = player || dt; 
        
        // 1. Гравитация для самого кристалла
        const groundY = world.getHeight(this.x + this.w / 2);
        if (this.y + this.h < groundY) {
            this.velocityY += 0.5; 
        } else {
            this.y = groundY - this.h;
            this.velocityY = 0;
            this.velocityX *= this.friction; 
        }

        // 2. Коллизия и пинание игроком
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;
        const pCenterX = actualPlayer.x + actualPlayer.size / 2;
        const pCenterY = actualPlayer.y + actualPlayer.size / 2;

        const dist = Math.hypot(centerX - pCenterX, centerY - pCenterY);
        const minDist = (this.w + actualPlayer.size) / 2;

        if (dist < minDist) {
            const angle = Math.atan2(centerY - pCenterY, centerX - pCenterX);
            const force = 3; // Маленькая сила пинка — кристалл тяжелый
            
            this.velocityX = Math.cos(angle) * force;
            this.velocityY = Math.sin(angle) * force - 1; 
        }

        // 3. Движение кристалла
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.rotation += this.velocityX * 0.03;

        if (this.x < 0) { this.x = 0; this.velocityX *= -this.bounce; }

        // Обновляем позицию источника света за кристаллом
        if (this.light) {
            this.light.x = this.x + this.w / 2;
            this.light.y = this.y + this.h / 2;
        }
    }

    draw(ctx, assets) {
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        // --- Отрисовка самого кристалла (опустили еще на 5px, итого +25) ---
        const img = assets[this.imgKey];
        if (img && img.complete) {
            ctx.save();
            ctx.translate(centerX, centerY + 25);
            ctx.rotate(this.rotation);
            ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
            ctx.restore();
        }
    }
}