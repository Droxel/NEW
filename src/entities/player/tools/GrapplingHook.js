//GrapplingHook.js
import { assets } from "../../../core/AssetLoader.js";
import { world } from "../../../world/World.js";
import { Braw } from "../../../core/Braw.js";

export class GrapplingHook {
    constructor(player) {
        this.player = player;
        this.active = false;      
        this.hooked = false;      
        this.x = 0;
        this.y = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 25;          // Чуть быстрее полет
        this.pullSpeed = 16;      
        this.maxDistance = 600;   
    }

    shoot(angle) { // Теперь принимаем угол от джойстика
        this.active = true;
        this.hooked = false;
        this.x = this.player.x + this.player.size / 2;
        this.y = this.player.y + this.player.size / 2;

        this.velocityX = Math.cos(angle) * this.speed;
        this.velocityY = Math.sin(angle) * this.speed;
    }

    release() {
        this.active = false;
        this.hooked = false;
    }

 update() {
    if (!this.active) return;

    if (!this.hooked) {
        // ПОЛЕТ КРЮКА: делаем 4 проверки за кадр вместо 2 (мини-рейкастинг)
        const subSteps = 4;
        for (let i = 0; i < subSteps; i++) {
            this.x += this.velocityX / subSteps;
            this.y += this.velocityY / subSteps;

            if (this.checkCollision(this.x, this.y)) {
                this.hooked = true;
                this.velocityX = 0;
                this.velocityY = 0;
                break;
            }
        }

        const dist = Math.hypot(this.x - (this.player.x + this.player.size / 2), this.y - (this.player.y + this.player.size / 2));
        if (dist > this.maxDistance) this.release();
} else {
            // ПРИТЯГИВАНИЕ ИГРОКА
            const targetX = this.x - this.player.size / 2;
            const targetY = this.y - this.player.size / 2;

            const dx = targetX - this.player.x;
            const dy = targetY - this.player.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 1) { // Минимальный порог, чтобы не дергаться
                // ГЛАВНЫЙ ФИКС: Скорость не может быть больше, чем оставшееся расстояние
                // Это предотвращает перелет (overshoot) точки крюка
                const currentPull = Math.min(this.pullSpeed, dist);
                
                const stepX = (dx / dist) * currentPull;
                const stepY = (dy / dist) * currentPull;

                this.player.velocityX = stepX;
                this.player.velocityY = stepY;

                this.player.x += stepX;
                this.player.checkWallCollisions('x'); 
                
                this.player.y += stepY;
                this.player.checkWallCollisions('y'); 
            } else {
                // Мы в точке назначения, зануляем всё
                this.player.x = targetX;
                this.player.y = targetY;
                this.player.velocityX = 0;
                this.player.velocityY = 0;
            }
        }
}

checkCollision(x, y) {
    const margin = 10; 

    // 1. ПРОВЕРКА ЗЕМЛИ
    const groundY = world.getHeight(x);
    if (groundY < 10000) { 
        if (y >= groundY - 5 && y <= groundY + 20) return true;
    }

    // 2. ПРОВЕРКА БЛОКОВ
    const chunkId = world.chunkManager.getChunkId(x);
    const chunk = world.chunkManager.chunks.get(chunkId);
    
    if (chunk && chunk.objects) {
        for (let obj of chunk.objects) {
            // ДОБАВЛЯЕМ ТИПЫ ДЕРЕВНИ: village_wall, village_house, village_decor
            if (
                obj.type === "dungeon_wall" || 
                obj.type === "dungeon_wall_smooth" || 
                obj.type === "blue_block" ||
                obj.type === "village_wall" ||  // Это ваши колонны
                obj.type === "village_house" || // Чтобы цепляться за крыши домов
                obj.type === "village_decor"    // Чтобы цепляться за колодцы/заборы
            ) {
                // Проверяем столкновение точки крюка с запасом (margin)
                if (x + margin > obj.x && x - margin < obj.x + obj.width &&
                    y + margin > obj.y && y - margin < obj.y + obj.height) {
                    return true;
                }
            }
        }
    }
    return false;
}
 // В GrapplingHook.js
draw(ctx, gameAssets) {
    if (!this.active) return;

    // Убираем "- cameraX", так как в braw.js мы уже сделали ctx.translate
    const pX = this.player.x + this.player.size / 2;
    const pY = this.player.y + this.player.size / 2;
    const hX = this.x;
    const hY = this.y;

    ctx.beginPath();
    ctx.moveTo(pX, pY);
    ctx.lineTo(hX, hY);
    ctx.strokeStyle = "#5c3a21";
    ctx.lineWidth = 3;
    ctx.stroke();

    const hookSize = 24;
    ctx.save();
    ctx.translate(hX, hY);
    ctx.rotate(Math.atan2(pY - hY, pX - hX) - Math.PI/2); 
    
    if (gameAssets?.hook?.complete) {
        ctx.drawImage(gameAssets.hook, -hookSize/2, -hookSize/2, hookSize, hookSize);
    } else {
        ctx.fillStyle = "gray";
        ctx.fillRect(-5, -5, 10, 10);
    }
    ctx.restore();
}
}