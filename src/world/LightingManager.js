// src/world/LightingManager.js
import { CONFIG } from "../data/config.js";

export class LightingManager {
    constructor() {
        this.flicker = 0;
    }

    update(player, world, dt) {
        this.flicker = Math.sin(performance.now() / 150) * 4;
    }

    draw(ctx, player, cameraX, cameraY, world, torches = []) {
        const centerGroundY = world.getHeight(cameraX + CONFIG.width / 2, true);
        
        // Оптимизация: не рисуем, если мы в облаках
        if (cameraY + CONFIG.height < centerGroundY - 300) return;

        ctx.save();

        // --- 1. ГЕОМЕТРИЯ ТЕМНОТЫ (ПОВТОРЯЕТ РЕЛЬЕФ) ---
        ctx.beginPath();
        const startX = Math.floor(cameraX);
        const endX = Math.floor(cameraX + CONFIG.width);
        const step = 50; 
        
        // СМЕЩЕНИЕ: теперь тень начинается глубоко (на 350px ниже травы)
        // Но саму линию полигона мы начнем рисовать чуть выше (на 200px), 
        // чтобы градиент успел плавно "растаять" до того, как кончится форма.
        const visualOffset = 350; 
        const polygonStartOffset = visualOffset - 150; 

        for (let x = startX - step; x <= endX + step; x += step) {
            const gy = world.getHeight(x, true);
            const screenX = x - cameraX;
            const screenY = gy - cameraY + polygonStartOffset; 
            if (x === startX - step) ctx.moveTo(screenX, screenY);
            else ctx.lineTo(screenX, screenY);
        }

        ctx.lineTo(endX + step - cameraX, CONFIG.height + 2000);
        ctx.lineTo(startX - step - cameraX, CONFIG.height + 2000);
        ctx.closePath();

        // --- 2. СУПЕР-ПЛАВНЫЙ ГРАДИЕНТ ---
        // Координаты привязаны к средней высоте земли
        const gStart = centerGroundY - cameraY + polygonStartOffset;
        const gEnd = gStart + 1200; // Растягиваем тьму на 1200 пикселей вниз

        const gradient = ctx.createLinearGradient(0, gStart, 0, gEnd);
        
        // Мягкая "лесенка" для удаления границ:
        gradient.addColorStop(0, "rgba(0, 0, 0, 0.0)");    // Полная прозрачность на стыке
        gradient.addColorStop(0.15, "rgba(0, 0, 0, 0.0)"); // Удерживаем прозрачность, чтобы скрыть край полигона
        gradient.addColorStop(0.3, "rgba(0, 0, 0, 0.2)");  // Едва заметная дымка
        gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.6)");  // Нарастание густоты
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.92)");   // Плотная тьма в самом низу

        ctx.fillStyle = gradient;
        ctx.fill();

        // --- 3. ФАКЕЛЫ ---
        // Ауры игрока нет, как и договаривались.
        if (torches.length > 0) {
            ctx.globalCompositeOperation = 'destination-out';
            torches.forEach(t => {
                this.drawLightCircle(ctx, t.x - cameraX, t.y - cameraY, 230 + this.flicker * 2, 1.0);
            });
        }

        ctx.restore();
    }

    drawLightCircle(ctx, x, y, radius, centerIntensity) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${centerIntensity})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${centerIntensity * 0.4})`);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

export const lightingManager = new LightingManager();