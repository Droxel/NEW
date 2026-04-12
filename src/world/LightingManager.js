/* src/world/LightingManager.js */
import { CONFIG } from "../data/config.js";

export class LightingManager {
    constructor() {
        this.flicker = 0;
        this.isEnabled = true;
        
        // Создаем буферный холст для подготовки слоя тьмы
        this.bufferCanvas = document.createElement('canvas');
        this.bufferCtx = this.bufferCanvas.getContext('2d');
    }

    update(dt) {
        this.flicker = Math.sin(performance.now() / 150) * 4;
        
        // Подгоняем размер буфера под экран, если он изменился
        if (this.bufferCanvas.width !== CONFIG.width || this.bufferCanvas.height !== CONFIG.height) {
            this.bufferCanvas.width = CONFIG.width;
            this.bufferCanvas.height = CONFIG.height;
        }
    }

    draw(ctx, player, cameraX, cameraY, world, lightSources = []) {
        if (!this.isEnabled) return;

        const bCtx = this.bufferCtx;
        const centerGroundY = world.getHeight(cameraX + CONFIG.width / 2, true);

        // 1. Очищаем буфер (делаем его полностью прозрачным)
        bCtx.clearRect(0, 0, CONFIG.width, CONFIG.height);

        // 2. РИСУЕМ ОСНОВНОЕ ПОЛОТНО ТЬМЫ (Цельный лист)
        bCtx.save();
        bCtx.beginPath();
        const startX = Math.floor(cameraX);
        const endX = Math.floor(cameraX + CONFIG.width);
        const step = 50; 
        const polygonStartOffset = 200; 
        
        for (let x = startX - step; x <= endX + step; x += step) {
            const gy = world.getHeight(x, true);
            const screenX = x - cameraX;
            const screenY = gy - cameraY + polygonStartOffset; 
            if (x === startX - step) bCtx.moveTo(screenX, screenY);
            else bCtx.lineTo(screenX, screenY);
        }
        bCtx.lineTo(CONFIG.width + 100, CONFIG.height + 2000);
        bCtx.lineTo(-100, CONFIG.height + 2000);
        bCtx.closePath();

        const gStart = centerGroundY - cameraY + polygonStartOffset;
        const gradient = bCtx.createLinearGradient(0, gStart, 0, gStart + 1200);
        gradient.addColorStop(0, "rgba(0, 0, 0, 0.0)");
        gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.85)"); // Плотная тьма
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.98)");
        
        bCtx.fillStyle = gradient;
        bCtx.fill();
        bCtx.restore();

        // 3. ВЫРЕЗАЕМ ДЫРКИ ОТ СВЕТА (Инструмент: Ластик)
        bCtx.globalCompositeOperation = 'destination-out';
        lightSources.filter(src => src.intensity > 0).forEach(light => {
            const radius = light.isTorch ? light.radius + this.flicker : light.radius;
            this.drawGradientCircle(bCtx, light.x - cameraX, light.y - cameraY, radius, light.intensity);
        });

        // 4. РИСУЕМ АУРУ БОССА (Инструмент: Отрицательный свет / Заплатка)
        // Мы возвращаем 'source-over', но рисуем на буфере, где уже есть дыры.
        // Это "заклеит" дыры от света темным цветом ауры босса.
        bCtx.globalCompositeOperation = 'source-over';
        lightSources.filter(src => src.intensity < 0).forEach(dark => {
            const absIntensity = Math.abs(dark.intensity);
            // Аура босса рисуется как "густая тьма", которая перекрывает даже свет игрока
            this.drawGradientCircle(bCtx, dark.x - cameraX, dark.y - cameraY, dark.radius, absIntensity, true);
        });

// 5. ВЫВОДИМ ГОТОВЫЙ СЛОЙ ТЬМЫ
ctx.save();
// Вместо setTransform используем просто отрисовку поверх всего экрана
// Если используешь камеру, убедись, что рисуешь в экранных координатах
ctx.setTransform(1, 0, 0, 1, 0, 0); 
ctx.drawImage(this.bufferCanvas, 0, 0, CONFIG.width, CONFIG.height);
ctx.restore();
    }

drawGradientCircle(ctx, x, y, radius, intensity, isBoss = false) {
    // 1. ПРОВЕРКА НА КОРРЕКТНОСТЬ (The Fix)
    // If any value is NaN, Infinity, or radius is missing, just skip drawing this light.
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) || radius <= 0) {
        return;
    }

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