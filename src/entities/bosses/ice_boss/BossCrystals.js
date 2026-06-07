// BossCrystals.js
import { assets } from "../../../core/AssetLoader.js";
import { audioManager } from "../../../core/AudioManager.js";

export class ShieldCrystal {
    constructor(offsetX, offsetY) {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.x = 0;
        this.y = 0;
        this.maxHp = 10; 
        this.hp = 10; 
        this.isBroken = false;

        // --- НОВЫЕ СВОЙСТВА ДЛЯ ВОЛНЫ ---
        this.waveActive = false; // Активна ли анимация волны
        this.waveRadius = 0;     // Текущий радиус
        this.waveAlpha = 0;      // Прозрачность
        this.maxWaveRadius = 150; // Насколько далеко разойдется волна
    }

    update(bossX, bossY) {
        // Обновляем позицию, даже если сломан, чтобы волна "выходила" из точки смерти
        const hover = Math.sin(Date.now() / 300) * 10;
        this.x = bossX + this.offsetX;
        this.y = bossY + this.offsetY + hover;

        // Логика расширения волны
        if (this.waveActive) {
            this.waveRadius += 4; // Скорость расширения
            this.waveAlpha -= 0.02; // Скорость затухания
            
            if (this.waveAlpha <= 0) {
                this.waveActive = false;
            }
        }
    }

takeDamage(amount) {
    if (this.isBroken) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
        this.isBroken = true;
        
        // ВОТ ОН, ЗВУК РАЗБИТИЯ:
        audioManager.playSFX('boss/ice_boss/crystal_broken.wav', 0.7);
        
        this.waveActive = true;
        this.waveRadius = 20;
        this.waveAlpha = 1.0;
        return true;
    }
    return false;
}
    draw(ctx) {
        // 1. Сначала рисуем волну (она должна быть видна даже если кристалл сломан)
        if (this.waveActive) {
            this.drawWave(ctx);
        }

        // 2. Если кристалл сломан, сам корпус больше не рисуем
        if (this.isBroken) return;
        
        const img = assets.protection_crystal;
        if (img && img.complete) {
            ctx.drawImage(img, this.x - 15, this.y - 20, 30, 40);
        } else {
            ctx.fillStyle = "#42f5e3";
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - 20);
            ctx.lineTo(this.x + 15, this.y);
            ctx.lineTo(this.x, this.y + 20);
            ctx.lineTo(this.x - 15, this.y);
            ctx.fill();
        }

        if (this.hp < this.maxHp) {
            this.drawHealthBar(ctx);
        }
    }

    drawWave(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.waveRadius, 0, Math.PI * 2);
        
        // Цвет волны (неоновый голубой, как у кристалла)
        ctx.strokeStyle = `rgba(66, 245, 227, ${this.waveAlpha})`;
        ctx.lineWidth = 3;
        
        // Добавляем свечение волне
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#42f5e3";
        
        ctx.stroke();
        
        // Дополнительная закрашенная область (мягкая аура)
        ctx.fillStyle = `rgba(66, 245, 227, ${this.waveAlpha * 0.2})`;
        ctx.fill();
        
        ctx.restore();
    }

    drawHealthBar(ctx) {
        const width = 30;
        const height = 4;
        const x = this.x - width / 2;
        const y = this.y - 35;

        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 2);
        ctx.fill();

        const healthWidth = (this.hp / this.maxHp) * width;
        ctx.fillStyle = "#42f5e3";
        ctx.beginPath();
        ctx.roundRect(x, y, healthWidth, height, 2);
        ctx.fill();
        
        ctx.shadowBlur = 5;
        ctx.shadowColor = "#42f5e3";
        ctx.stroke(); 
        ctx.shadowBlur = 0;
    }
}