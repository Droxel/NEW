/* src/world/sky/BackgroundManager.js */
import { CONFIG } from "../../data/config.js"; 
// Исправлено: добавлено ../ чтобы выйти из папки sky в папку world
import { getBiomeMix } from "../terrain/BiomeMap.js";
export class BackgroundManager {
    constructor() {
        // Конфигурация слоев
        this.layers = [
            { key: 'desert', imgKey: 'bg_desert', parallax: 0.1, scale: 0.8, offsetY: 40 }, 
            { key: 'plains', imgKey: 'bg_mountains', parallax: 0.12, scale: 0.6, offsetY: 10 }, 
            { key: 'forest', imgKey: 'bg_forest', parallax: 0.15, scale: 0.6, offsetY: 10 },
            { key: 'jungle', imgKey: 'bg_jungles', parallax: 0.18, scale: 0.5, offsetY: 0 },
            { key: 'snow', imgKey: 'bg_winter', parallax: 0.1, scale: 0.5, offsetY: 50 }
        ];

        // Кэш для размеров, чтобы не пересчитывать математику каждый кадр
        this._sizeCache = {};
    }

    draw(ctx, assets, cameraX, cameraY) {
        const screenCenterX = cameraX + (CONFIG.width >> 1); // Используем битовый сдвиг вместо / 2 (быстрее)
        const biomeMix = getBiomeMix(screenCenterX);

        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            const weight = biomeMix[layer.key];

            // ОПТИМИЗАЦИЯ 1: Пропускаем слой, если он почти прозрачный
            if (!weight || weight < 0.01) continue;

            const img = assets[layer.imgKey];
            if (!img || !img.complete || img.naturalHeight === 0) continue;

            // ОПТИМИЗАЦИЯ 2: Кэширование размеров (считаем один раз для каждого изображения)
            if (!this._sizeCache[layer.key]) {
                this._sizeCache[layer.key] = {
                    dw: (img.width * layer.scale) | 0,
                    dh: (img.height * layer.scale) | 0
                };
            }

            const { dw, dh } = this._sizeCache[layer.key];

            // ОПТИМИЗАЦИЯ 3: Убираем ctx.save()/restore(). 
            // Менять напрямую globalAlpha быстрее, чем сохранять весь стейк контекста.
            ctx.globalAlpha = weight;

            // Рассчитываем X для параллакса
            const parallaxX = cameraX * layer.parallax; 
            
            // ОПТИМИЗАЦИЯ 4: Используем побитовое ИЛИ (| 0) для округления до целых чисел.
            // Отрисовка по целым координатам значительно быстрее, так как отключает субпиксельное сглаживание.
            let shiftX = (-(parallaxX % dw)) | 0; 
            if (shiftX > 0) shiftX -= dw;

            const drawY = ((CONFIG.height - dh) + layer.offsetY) | 0; 

            // ОПТИМИЗАЦИЯ 5: Умная отрисовка тайлов. 
            // Рисуем 3-ю копию только если экран действительно шире, чем два изображения.
            ctx.drawImage(img, shiftX, drawY, dw, dh);
            
            const secondTileX = shiftX + dw;
            if (secondTileX < CONFIG.width) {
                ctx.drawImage(img, secondTileX, drawY, dw, dh);
                
                const thirdTileX = secondTileX + dw;
                if (thirdTileX < CONFIG.width) {
                    ctx.drawImage(img, thirdTileX, drawY, dw, dh);
                }
            }
        }

        // Возвращаем альфу в стандартное состояние для остальной игры
        ctx.globalAlpha = 1.0;
    }
}