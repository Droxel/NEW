/* src/world/sky/BackgroundManager.js */
import { CONFIG } from "../../core/config.js";
import { getBiomeMix } from "../terrain/biomeMap.js";

export class BackgroundManager {
    constructor() {
        // НАСТРОЙКИ КАЖДОГО ФОНА
        // scale: 1.0 — оригинал, 0.5 — в два раза меньше.
        // offsetY: 0 — по умолчанию (низ), 100 — опустить ниже, -100 — поднять выше.
        // parallax: 0.1 — медленно, 0.5 — быстро.
        this.layers = [
            { 
                key: 'desert', 
                imgKey: 'bg_desert', 
                parallax: 0.1, 
                scale: 0.8, 
                offsetY: 40 
            }, 
            { 
                key: 'plains', 
                imgKey: 'bg_mountains', 
                parallax: 0.12, 
                scale: 0.6, 
                offsetY: 10
            }, 
            { 
                key: 'forest', 
                imgKey: 'bg_forest', 
                parallax: 0.15, 
                scale: 0.6, 
                offsetY: 10 
            },
            { 
                key: 'jungle', 
                imgKey: 'bg_jungles', 
                parallax: 0.18, 
                scale: 0.5,    // Сделали меньше
                offsetY: 0  // Опустили ниже
            },
            { 
                key: 'snow',   
                imgKey: 'bg_winter', 
                parallax: 0.1, 
                scale: 0.5, 
                offsetY: 50 
            }
        ];
    }

    draw(ctx, assets, cameraX, cameraY) {
        const screenCenterX = cameraX + CONFIG.width / 2;
        const biomeMix = getBiomeMix(screenCenterX);

        this.layers.forEach(layer => {
            const weight = biomeMix[layer.key];
            if (!weight || weight <= 0) return;

            const img = assets[layer.imgKey];
            if (!img || !img.complete || img.naturalHeight === 0) return;

            ctx.save();
            ctx.globalAlpha = weight;

            // Берем индивидуальные настройки слоя
            const s = layer.scale || 1.0;
            const offY = layer.offsetY || 0;

            // Считаем итоговую ширину и высоту
            const dw = img.width * s;
            const dh = img.height * s;

            // Рассчитываем X для параллакса
            const parallaxX = cameraX * layer.parallax; 
            
            // Зацикливание (тайлинг)
            let shiftX = -(parallaxX % dw); 
            if (shiftX > 0) shiftX -= dw;

            // Рассчитываем Y (прижимаем к низу экрана + наш оффсет)
            let drawY = (CONFIG.height - dh) + offY; 

            // Отрисовываем 3 копии, чтобы не было дырок при скролле
            ctx.drawImage(img, shiftX, drawY, dw, dh);
            ctx.drawImage(img, shiftX + dw, drawY, dw, dh);
            
            if (shiftX + dw < CONFIG.width) {
                 ctx.drawImage(img, shiftX + dw * 2, drawY, dw, dh);
            }

            ctx.restore();
        });
    }
}