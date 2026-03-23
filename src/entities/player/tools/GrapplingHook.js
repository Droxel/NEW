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
        this.hookedMob = null;   // Ссылка на моба, за которого зацепились
this.mobOffsetX = 0;     // Локальное смещение по X
this.mobOffsetY = 0;     // Локальное смещение по Y
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
        this.hookedMob = null; // Очищаем
    }

update() {
        if (!this.active) return;

        // --- НОВОЕ: Если зацепились за моба, подтягиваем точку крюка к нему ---
        if (this.hooked && this.hookedMob) {
            this.x = this.hookedMob.x + (this.mobOffsetX * this.hookedMob.facing);
            this.y = this.hookedMob.y + this.mobOffsetY;
            
            if (this.hookedMob.isDead) this.release(); // Отцепляемся, если босс умер
        }

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
                
                // --- НОВОЕ: Автоматический прыжок от головы босса ---
                if (this.hookedMob) {
                    this.release(); // Отцепляем крюк
                    this.player.velocityY = -10; // Подбрасываем игрока вверх!
                    this.player.onGround = false;
                }
            }
        }
}

checkCollision(x, y) {
    const margin = 10; 
    const hookRadius = 15; // Немного увеличим радиус для надежности

    const extractEntities = (collection) => {
        if (!collection) return [];
        // Если это Map или Set
        if (collection instanceof Map || collection instanceof Set) return Array.from(collection.values());
        // Если это массив
        if (Array.isArray(collection)) return collection;
        // Если это одиночный объект (например, world.bossManager.currentBoss)
        if (typeof collection === 'object') {
            if (collection.headHitbox) return [collection]; // Это сам моб
            return Object.values(collection); // Это контейнер с мобами
        }
        return [];
    };

    // Собираем всех вообще: и обычных мобов, и боссов, и просто сущности
    const mobs = extractEntities(world.mobManager?.mobs);
    const bosses = extractEntities(world.bossManager?.bosses);
    const activeBoss = world.bossManager?.boss ? [world.bossManager.boss] : []; // На случай если босс один
    const entities = extractEntities(world.entities); 
    
    const allTargets = [...mobs, ...bosses, ...activeBoss, ...entities];

    for (let mob of allTargets) {
        if (!mob || mob.isDead || mob === this.player) continue;
        
        const hb = mob.headHitbox;
        
        // ФИКС: Проверяем и .width (из getPartHitbox) и .w (из конструктора)
        const hbW = hb?.width || hb?.w || 0;
        const hbH = hb?.height || hb?.h || 0;

        if (hb && hbW > 0) {
            // Простая и надежная проверка пересечения точки (x,y) с прямоугольником hb
            if (x > hb.x && x < hb.x + hbW && 
                y > hb.y && y < hb.y + hbH) {
                
                console.log("🎯 Попал в голову:", mob.constructor.name); 
                this.hookedMob = mob;
                // Запоминаем смещение относительно центра моба, учитывая поворот
                this.mobOffsetX = (x - mob.x) / mob.facing; 
                this.mobOffsetY = y - mob.y;
                return true;
            }
        }
    }

    // 2. ПРОВЕРКА ЗЕМЛИ
    const groundY = world.getHeight(x);
    if (groundY < 10000) { 
        if (y >= groundY - 5 && y <= groundY + 20) return true;
    }

    // 3. ПРОВЕРКА БЛОКОВ
    const chunkId = world.chunkManager.getChunkId(x);
    const chunk = world.chunkManager.chunks.get(chunkId);
    
    if (chunk && chunk.objects) {
        for (let obj of chunk.objects) {
            if (
                obj.type === "dungeon_wall" || 
                obj.type === "dungeon_wall_smooth" || 
                obj.type === "blue_block" ||
                obj.type === "village_wall" ||  
                obj.type === "village_house" || 
                obj.type === "village_decor"    
            ) {
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