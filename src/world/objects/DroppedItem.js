/* src/world/objects/DroppedItem.js */
import { world } from "../world.js";
import { CONFIG } from "../../core/config.js";

export class DroppedItem {
    constructor(x, y, itemData) {
        this.x = x;
        this.y = y;
        this.itemData = { ...itemData }; 
        this.size = 20;
        
        // Физика вылета: чуть слабее, чтобы не пролетали сквозь стены на старте
        this.vx = (Math.random() - 0.5) * 5; 
        this.vy = -4 - Math.random() * 3; 
        
        this.lifeTime = 0;
        this.pickupDelay = 50; 
        this.onGround = false;
        
       this.isBeingConsumed = false; // когда предмет поднимается к призраку
this.floatTimer = 0;          // для анимации подъема

    }

update(dt, player, inventory, inventoryUI) {
    // Если призрак начал взаимодействие
    if (this.isBeingConsumed) {
        this.floatTimer++;
        this.y -= 0.8; // Медленно плывем вверх
        this.vx = 0;
        this.vy = 0;
        
        // Если призрак пометил предмет как подобранный (в коде выше), 
        // возвращаем true, чтобы main.js удалил его из массива
        if (this.pickedUp) return true; 
        
        return false; // Пока летим вверх — магнит игрока не работает
    }
    
    const surfaceY = world.getHeight(this.x, true);
    const isBelowSurface = this.y > surfaceY + 5;

    // ---------------------
    // 1. ФИЗИКА
    // ---------------------
    if (!this.onGround) {
        this.vy += 0.35;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
    }

    // ---------------------
    // 2. СТЕНЫ ДАНЖА
    // ---------------------
    if (!this.onGround && world.chunkManager) {

        const chunkId = world.chunkManager.getChunkId(this.x);
        const chunk = world.chunkManager.chunks.get(chunkId);

        if (chunk && chunk.objects) {
            for (let obj of chunk.objects) {

                if (obj.type && obj.type.includes("wall")) {

                    if (this.x + this.size > obj.x &&
                        this.x < obj.x + obj.width &&
                        this.y + this.size > obj.y &&
                        this.y < obj.y + obj.height) {

                        // Падение сверху
                        if (this.vy >= 0 &&
                            (this.y + this.size - this.vy) <= obj.y + 5) {

                            this.y = obj.y - this.size;
                            this.vy = 0;
                            this.vx = 0;
                            this.onGround = true;
                            break;
                        }
                        else {
                            this.x -= this.vx;
                            this.vx = 0;
                        }
                    }
                }
            }
        }
    }

    // ---------------------
    // 3. ПОВЕРХНОСТЬ (ТОЛЬКО ЕСЛИ НЕ ПОД ЗЕМЛЁЙ)
    // ---------------------
    if (!this.onGround && !isBelowSurface) {

        if (this.y + this.size >= surfaceY) {
            this.y = surfaceY - this.size;
            this.vy = 0;
            this.vx = 0;
            this.onGround = true;
        }
    }

    // ---------------------
    // 4. ЛОГИКА ЖИЗНИ
    // ---------------------
    this.lifeTime++;
    if (this.pickupDelay > 0) this.pickupDelay--;

    // ---------------------
    // 5. МАГНИТ
    // ---------------------
    if (!this.isBeingConsumed && this.pickupDelay <= 0 && player && inventory) {

        const dx = (player.x + player.size/2) - (this.x + this.size/2);
        const dy = (player.y + player.size/2) - (this.y + this.size/2);
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 120) {
            this.vx = dx * 0.05;
            this.vy = dy * 0.05;
            this.onGround = false;
        }

if (dist < 30) {
        if (inventory.addItem(this.itemData)) {
            if (inventoryUI) inventoryUI.refresh();
            this.pickedUp = true; // Помечаем для удаления
            return true;
        }
    }
    }
    return false;
}

draw(ctx) {
    if (!this.img && this.itemData.icon) {
        this.img = new Image();
        this.img.src = this.itemData.icon;
    }

    if (this.img && this.img.complete) {
        const bob = this.onGround ? Math.sin(this.lifeTime * 0.1) * 3 : 0;
        
        // --- 1. ИСПРАВЛЕНИЕ ДЕФОРМАЦИИ ---
        // Вычисляем размеры так, чтобы сохранить пропорции (чтобы жезл не сплющивало)
        const ratio = this.img.width / this.img.height;
        let drawW = this.size;
        let drawH = this.size;
        if (ratio > 1) drawH = this.size / ratio;
        else drawW = this.size * ratio;

        // Центрируем предмет относительно X
        const offsetX = (this.size - drawW) / 2;

        ctx.save();

        // --- 2. КРАСИВАЯ АНИМАЦИЯ ДЛЯ ЖЕЗЛА ПРИРУЧЕНИЯ ---
        // Проверяем по ID или по имени (подставь свое значение, если оно другое)
        const isTamingWand = this.itemData.id === 'taming_wand' || this.itemData.name?.includes("прируч");

        if (isTamingWand || this.isBeingConsumed) {
            // Пульсирующее свечение
            const pulse = Math.abs(Math.sin(this.lifeTime * 0.08));
            ctx.shadowBlur = 15 + pulse * 10;
            ctx.shadowColor = isTamingWand ? "#00ffff" : "yellow"; // Голубое для жезла, желтое для призрака
            ctx.globalAlpha = 0.8 + pulse * 0.2;
            
            // Если это жезл приручения, добавим "звездочки"
            if (isTamingWand) {
                ctx.fillStyle = "white";
                for(let i = 0; i < 3; i++) {
                    const sparkX = this.x + Math.cos(this.lifeTime * 0.05 + i * 2) * 15;
                    const sparkY = this.y + Math.sin(this.lifeTime * 0.05 + i * 2) * 15;
                    ctx.beginPath();
                    ctx.arc(sparkX + 10, sparkY + 10, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Рисуем сам предмет
        ctx.drawImage(this.img, this.x + offsetX, this.y + bob, drawW, drawH);
        
        ctx.restore();

        // --- 3. ЦИФРЫ УДАЛЕНЫ ---
        // Блок с отрисовкой count удален, как ты и просил
    }
}
}