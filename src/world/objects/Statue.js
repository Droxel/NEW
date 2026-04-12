//Statue.js

import { bossManager } from "../../entities/bosses/BossManager.js";

export class Statue {
    constructor(x, y, config) {
        this.x = x;
        this.y = y + 50; 
        this.config = config;
        this.isUsed = false;
        
        this.width = config.width;
        this.height = config.height;
        this.imgKey = config.imgKey;
        this.alpha = 1;
    }

    interact(player) {
        if (this.isUsed) return;
        const dist = Math.abs(player.x - this.x);
        if (dist <= this.config.interactionRadius) {
            // При спавне босса передаем чистый y (без вкопания), чтобы босс не застрял
            const success = bossManager.spawn(this.config.bossKey, this.x, this.y - 10);
            if (success) {
                this.isUsed = true;
                this.alpha = 0.5;
            }
        }
    }

draw(ctx, assets) {
    const img = assets[this.imgKey]; 
    
    // ПРОВЕРКА: Если объекта нет, он еще грузится ИЛИ он загрузился битым (naturalWidth === 0)
    if (!img || !img.complete || img.naturalWidth === 0) {
        ctx.fillStyle = 'red';
        // Рисуем красный прямоугольник, чтобы ты видел, где должна быть статуя
        ctx.fillRect(this.x - this.width/2, this.y - this.height, this.width, this.height);
        
        // Помощь в отладке: пишем в консоль, какой именно ключ хромает
        if (img && img.complete && img.naturalWidth === 0) {
            console.warn(`Картинка по ключу "${this.imgKey}" битая! Проверь путь в AssetLoader.`);
        }
        return;
    }

    ctx.save();
    ctx.globalAlpha = this.alpha;

    ctx.drawImage(
        img,
        this.x - this.width / 2, 
        this.y - this.height,    
        this.width,
        this.height
    );
    
    ctx.restore();
}
}