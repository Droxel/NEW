/* src/world/LightingManager.js */
import { CONFIG } from "../data/config.js";
import { OCEAN_WATER_LEVEL, getOceanMix } from "./Ocean.js"; 

export class LightingManager {
    constructor() {
        this.flicker = 0;
        this.isEnabled = true;
        
        // --- НОВОЕ ДЛЯ ПОДЪЕМА ТЬМЫ ---
        this.baseOffset = 200; // Обычное состояние (тьма глубоко под землей)
        this.targetOffset = this.baseOffset;
        this.currentOffset = this.baseOffset;
        // ------------------------------

        this.bufferCanvas = document.createElement('canvas');
        this.bufferCtx = this.bufferCanvas.getContext('2d');
    }

    // Метод для изменения высоты тьмы из других менеджеров
    setDarknessOffset(target) {
        this.targetOffset = target;
    }

    update(dt) {
        this.flicker = Math.sin(performance.now() / 150) * 4;
        
        // Плавный переход смещения (изменяй 0.8 для скорости подъема)
        this.currentOffset += (this.targetOffset - this.currentOffset) * dt * 0.8;

        if (this.bufferCanvas.width !== CONFIG.width || this.bufferCanvas.height !== CONFIG.height) {
            this.bufferCanvas.width = CONFIG.width;
            this.bufferCanvas.height = CONFIG.height;
        }
    }

    draw(ctx, player, cameraX, cameraY, world, lightSources = [], zoomLevel = 1.0) {
        if (!this.isEnabled) return;

        const bCtx = this.bufferCtx;
        const centerWorldX = cameraX + (CONFIG.width / 2) / zoomLevel;
        let centerGroundY = world.getHeight(centerWorldX, true);
        
        const centerMix = getOceanMix(centerWorldX);
        if (centerMix.weight > 0.01 && centerGroundY > OCEAN_WATER_LEVEL) {
            centerGroundY = OCEAN_WATER_LEVEL;
        }

        bCtx.clearRect(0, 0, CONFIG.width, CONFIG.height);

        bCtx.save();
        bCtx.beginPath();
        
        const startX = Math.floor(cameraX - 500); 
        const endX = Math.floor(cameraX + (CONFIG.width / zoomLevel) + 500);
        const step = 50; 
        
        // ИСПОЛЬЗУЕМ ДИНАМИЧЕСКОЕ СМЕЩЕНИЕ ВМЕСТО ХАРДКОДА
        const polygonStartOffset = this.currentOffset; 
        
        for (let x = startX - step; x <= endX + step; x += step) {
            let gy = world.getHeight(x, true);
            
            const mix = getOceanMix(x);
            if (mix.weight > 0.01 && gy > OCEAN_WATER_LEVEL) {
                gy = OCEAN_WATER_LEVEL;
            }

            const screenX = (x - cameraX) * zoomLevel; 
            const screenY = (gy - cameraY + polygonStartOffset) * zoomLevel; 
            
            if (x === startX - step) bCtx.moveTo(screenX, screenY);
            else bCtx.lineTo(screenX, screenY);
        }
        bCtx.lineTo(CONFIG.width + 1000, CONFIG.height + 2000);
        bCtx.lineTo(-1000, CONFIG.height + 2000);
        bCtx.closePath();

        const gStart = (centerGroundY - cameraY + polygonStartOffset) * zoomLevel;
        const gradient = bCtx.createLinearGradient(0, gStart, 0, gStart + (1200 * zoomLevel));
        gradient.addColorStop(0, "rgba(0, 0, 0, 0.0)");
        gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.85)"); 
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.98)");
        
        bCtx.fillStyle = gradient;
        bCtx.fill();
        bCtx.restore();

        // 3. ВЫРЕЗАЕМ ДЫРКИ ОТ СВЕТА 
        bCtx.globalCompositeOperation = 'destination-out';
        lightSources.filter(src => src.intensity > 0).forEach(light => {
            const radius = (light.isTorch ? light.radius + this.flicker : light.radius) * zoomLevel;
            this.drawGradientCircle(bCtx, (light.x - cameraX) * zoomLevel, (light.y - cameraY) * zoomLevel, radius, light.intensity);
        });

        // 4. РИСУЕМ АУРА БОССА 
        bCtx.globalCompositeOperation = 'source-over';
        lightSources.filter(src => src.intensity < 0).forEach(dark => {
            const absIntensity = Math.abs(dark.intensity);
            const radius = dark.radius * zoomLevel;
            this.drawGradientCircle(bCtx, (dark.x - cameraX) * zoomLevel, (dark.y - cameraY) * zoomLevel, radius, absIntensity, true);
        });

        ctx.save();
        ctx.drawImage(this.bufferCanvas, 0, 0, CONFIG.width, CONFIG.height);
        ctx.restore();
    }

    drawGradientCircle(ctx, x, y, radius, intensity, isBoss = false) {
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) || radius <= 0) return;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        if (isBoss) {
            grad.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
            grad.addColorStop(0.7, `rgba(0, 0, 0, ${intensity * 0.5})`);
            grad.addColorStop(1, `rgba(0, 0, 0, 0)`);
        } else {
            grad.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
            grad.addColorStop(0.5, `rgba(255, 255, 255, ${intensity * 0.4})`);
            grad.addColorStop(1, `rgba(255, 255, 255, 0)`);
        }
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

export const lightingManager = new LightingManager();