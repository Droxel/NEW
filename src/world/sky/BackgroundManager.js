/* src/world/sky/BackgroundManager.js */
import { CONFIG } from "../../data/config.js"; 
// Исправлено: добавлено ../ чтобы выйти из папки sky в папку world
import { getBiomeMix } from "../terrain/BiomeMap.js";
import { getOceanMix } from "../Ocean.js";
export class BackgroundManager {
    constructor() {
        // Конфигурация слоев
        this.layers = [
            // Порядок слоев важен! Океан ставим первым, чтобы он был "самым дальним"
            // imgKey берем из AssetLoader (убедись, что там прописано 'bg_ocean': 'ocean.png')
            { key: 'ocean', imgKey: 'bg_ocean', parallax: 0.05, scale: 0.9, offsetY: 0, isOcean: true },

            { key: 'desert', imgKey: 'bg_desert', parallax: 0.1, scale: 0.8, offsetY: 40 }, 
            { key: 'plains', imgKey: 'bg_mountains', parallax: 0.12, scale: 0.6, offsetY: 10 }, 
            { key: 'forest', imgKey: 'bg_forest', parallax: 0.15, scale: 0.6, offsetY: 10 },
            { key: 'jungle', imgKey: 'bg_jungles', parallax: 0.18, scale: 0.5, offsetY: 0 },
            { key: 'snow', imgKey: 'bg_winter', parallax: 0.1, scale: 0.5, offsetY: 50 },
            { key: 'village', imgKey: 'bg_forest', parallax: 0.12, scale: 0.7, offsetY: 20 } 
        ];

        this._sizeCache = {};
    }

    draw(ctx, assets, cameraX, cameraY) {
        const screenCenterX = cameraX + (CONFIG.width >> 1);
        
        // Получаем миксы биомов и океана
        const biomeMix = getBiomeMix(screenCenterX);
        const oceanMix = getOceanMix(screenCenterX);

        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            
            // --- НОВАЯ ЛОГИКА ОПРЕДЕЛЕНИЯ ВЕСА ---
            let weight = 0;
            if (layer.isOcean) {
                // Если это слой океана, берем его вес из oceanMix
                weight = oceanMix.weight;
            } else {
                // Иначе берем из обычного biomeMix
                weight = biomeMix[layer.key];
            }

            if (!weight || weight < 0.01) continue;

            const img = assets[layer.imgKey];
            if (!img || !img.complete || img.naturalHeight === 0) continue;

            if (!this._sizeCache[layer.key]) {
                this._sizeCache[layer.key] = {
                    dw: (img.width * layer.scale) | 0,
                    dh: (img.height * layer.scale) | 0
                };
            }

            const { dw, dh } = this._sizeCache[layer.key];

            ctx.globalAlpha = weight;

            const parallaxX = cameraX * layer.parallax; 
            
            let shiftX = (-(parallaxX % dw)) | 0; 
            if (shiftX > 0) shiftX -= dw;

            const drawY = ((CONFIG.height - dh) + layer.offsetY) | 0; 

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

        ctx.globalAlpha = 1.0;
    }
}