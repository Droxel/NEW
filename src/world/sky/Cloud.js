/* src/world/sky/Cloud.js */
import { CONFIG } from "../../data/config.js";

export class Cloud {
    constructor() {
        this.cacheCanvas = document.createElement('canvas');
        this.cacheCtx = this.cacheCanvas.getContext('2d');
        
        this.currentColor = { r: 255, g: 255, b: 255 };
        this.lastSunFactor = -1;
        this.reset(true);
    }

    reset(randomX = false) {
        this.size = 30 + Math.random() * 40;
        this.speed = 15 + Math.random() * 20;
        this.x = randomX ? Math.random() * CONFIG.width : -this.size * 4;
        this.y = Math.random() * (CONFIG.height * 0.4);
        this.opacity = 0;
        this.targetOpacity = 0.5 + Math.random() * 0.3;

        const bufferSize = (this.size * 4) | 0;
        this.cacheCanvas.width = bufferSize;
        this.cacheCanvas.height = bufferSize;
        this.lastSunFactor = -1; 
    }

    update(dt) {
        this.x += this.speed * dt;
        if (this.opacity < this.targetOpacity) this.opacity += dt * 0.5;
        return this.x > CONFIG.width + this.size * 3;
    }

    redrawCache(sunFactor) {
        const ctx = this.cacheCtx;
        const sz = this.size;
        const center = this.cacheCanvas.width >> 1; // Быстрое деление на 2
        
        ctx.clearRect(0, 0, this.cacheCanvas.width, this.cacheCanvas.height);

        const lerp = (a, b, f) => a + (b - a) * f;
        
        const drawBubble = (ox, oy, bubbleSz) => {
            const cx = center + ox;
            const cy = center + oy;
            const grad = ctx.createLinearGradient(cx, cy - bubbleSz, cx, cy + bubbleSz);
            
            // Используем побитовое округление (| 0) вместо Math.round
            const topColor = `rgb(${this.currentColor.r | 0}, ${this.currentColor.g | 0}, ${this.currentColor.b | 0})`;
            
            const glow = CONFIG.SKY.clouds.sunsetGlow;
            const botColor = `rgb(${lerp(this.currentColor.r, glow.r, sunFactor) | 0}, ${lerp(this.currentColor.g, glow.g, sunFactor) | 0}, ${lerp(this.currentColor.b, glow.b, sunFactor) | 0})`;

            grad.addColorStop(0, topColor);
            grad.addColorStop(1, botColor);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, bubbleSz, 0, Math.PI * 2);
            ctx.fill();
        };

        drawBubble(0, 0, sz);
        drawBubble(-sz * 0.5, sz * 0.1, sz * 0.7);
        drawBubble(sz * 0.6, sz * 0.2, sz * 0.6);
        drawBubble(sz * 0.2, -sz * 0.4, sz * 0.5);
        
        this.lastSunFactor = (sunFactor * 100) | 0; 
    }

    draw(ctx, targetBaseColor, sunFactor) {
        // Плавно меняем цвет только если он заметно отличается (чтобы не дергать математику впустую)
        if (Math.abs(this.currentColor.r - targetBaseColor.r) > 1) {
            this.currentColor.r += (targetBaseColor.r - this.currentColor.r) * 0.05;
            this.currentColor.g += (targetBaseColor.g - this.currentColor.g) * 0.05;
            this.currentColor.b += (targetBaseColor.b - this.currentColor.b) * 0.05;
        }

        const currentSunKey = (sunFactor * 100) | 0;
        if (this.lastSunFactor !== currentSunKey) {
            this.redrawCache(sunFactor);
        }

        // ОПТИМИЗАЦИЯ: Убрали save/restore. 
        // Меняем прозрачность напрямую и рисуем по целым координатам.
        const prevAlpha = ctx.globalAlpha;
        ctx.globalAlpha = this.opacity;
        
        const offset = this.cacheCanvas.width >> 1;
        ctx.drawImage(this.cacheCanvas, (this.x - offset) | 0, (this.y - offset) | 0);
        
        ctx.globalAlpha = prevAlpha;
    }
}