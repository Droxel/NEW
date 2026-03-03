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

draw(ctx, assets) { // Убрали camX, camY из аргументов
        const img = assets[this.imgKey]; 
        
        // Если картинка не загрузилась, рисуем красный прямоугольник для теста
        if (!img || !img.complete) {
            ctx.fillStyle = 'red';
            // Рисуем относительно центра x, и y - высота (так как y - это земля)
            ctx.fillRect(this.x - this.width/2, this.y - this.height, this.width, this.height);
            return;
        }

        ctx.save();
        ctx.globalAlpha = this.alpha;

        // Рисуем саму статую
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