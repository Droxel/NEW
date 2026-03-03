/* src/world/objects/LifeBush.js */
/* src/world/objects/LifeBush.js */
import { assets } from "../../core/braw.js"; 
import { LIFE_FRUIT_ITEM } from "../../core/lootConfig.js"; // Импортируем наш конфиг

export class LifeBush {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 65;  
        this.height = 65;
        this.isBroken = false;
    }

    draw(ctx, cameraX, cameraY) {
        if (this.isBroken) return;
        const key = this.getImageKey();
        if (key && assets[key]) {
            ctx.drawImage(assets[key], this.x - cameraX, this.y - cameraY, this.width, this.height);
        }
    }

    checkCollision(player) {
        // 1. МГНОВЕННАЯ ПРОВЕРКА
        if (this.isBroken) return null;

        if (player.velocityY > 0 &&
            player.x + player.size > this.x &&
            player.x < this.x + this.width &&
            player.y + player.size >= this.y &&
            player.y + player.size <= this.y + 15) {
            
            // 2. СТАВИМ ФЛАГ СРАЗУ (Блокируем следующий кадр)
            this.isBroken = true; 
            
            player.velocityY = -6; // Отскок
            
            // 3. ВОЗВРАЩАЕМ ДАННЫЕ
            return this.getFruitData();
        }
        return null;
    }

    getFruitData() {
        // Используем данные из твоего lootConfig, чтобы не было расхождений
        return {
            id: LIFE_FRUIT_ITEM.id, // 'life_fruit'
            name: LIFE_FRUIT_ITEM.name,
            description: LIFE_FRUIT_ITEM.description,
            icon: LIFE_FRUIT_ITEM.icon,
            count: 1,
            type: 'consumable'
        };
    }

    getImageKey() {
        return this.isBroken ? null : "bush_life"; 
    }
}