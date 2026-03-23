import { Mob } from './Mob.js';
import { assets } from '../../core/Braw.js';
import { CONFIG } from "../../data/config.js";
import { world } from "../../world/World.js";

export class GiantMob extends Mob {
    constructor(x, y) {
        super(x, y);
        
        this.parts = {
            "legL":  { "name": "giant_arm",  "ox": 8,   "oy": 126, "w": 62,  "h": 161, "px": 0.5, "py": 0.1, "angle": 0 },
            "legR":  { "name": "giant_arm",  "ox": 38,  "oy": 126, "w": 62,  "h": 161, "px": 0.5, "py": 0.1, "angle": 0 },
            "footL": { "name": "giant_fist", "ox": 7,   "oy": 241, "w": 98,  "h": 60,  "px": 0.5, "py": 0.2, "angle": 0 },
            "footR": { "name": "giant_fist", "ox": 39,  "oy": 241, "w": 102, "h": 60,  "px": 0.5, "py": 0.2, "angle": 0 },
            "armL":  { "name": "giant_arm",  "ox": 82,  "oy": 20,  "w": 60,  "h": 130, "px": 0.5, "py": 0.1, "angle": 0 },
            "fistL": { "name": "giant_fist", "ox": 87,  "oy": 102, "w": 90,  "h": 70,  "px": 0.5, "py": 0.2, "angle": 0 },
            "body":  { "name": "giant_body", "ox": -22, "oy": 0,   "w": 150, "h": 200, "px": 0.5, "py": 0.5, "angle": 0 },
            "head":  { "name": "giant_head", "ox": 63,  "oy": -46, "w": 98,  "h": 94,  "px": 0.5, "py": 0.9, "angle": 0 },
            "armR":  { "name": "giant_arm",  "ox": 23,  "oy": 20,  "w": 60,  "h": 130, "px": 0.5, "py": 0.1, "angle": 0 },
            "fistR": { "name": "giant_fist", "ox": 18,  "oy": 112, "w": 90,  "h": 70,  "px": 0.5, "py": 0.2, "angle": 0 }
        };

        this.width = 150;
        this.height = 250;
        this.health = 500;
        this.maxHealth = 500;
        this.speed = 1.1; 
        this.velocityY = 0;
        this.onGround = false;

        this.animTime = 0;
        this.walkCycle = 0; // НОВОЕ: цикл анимации, зависящий только от реальных шагов
        this.state = 'idle'; 
        this.facing = 1;       
        
        this.detectionRange = 600;
        this.attackRange = 150; 
        this.stompRange = 60;  
        
        this.isBlocked = false;       
        this.blockedTimer = 0;        
        this.ignorePlayerTimer = 0;   

        this.stompTimer = 0; 
        this.attackTimer = 0; 
        this.liftLeg = false; 

        // Хранилище хитбоксов для боевки
this.headHitbox = { x: 0, y: 0, width: 0, height: 0 }; // Сразу используем width/height
    this.updateHitboxes(); // Обновляем один раз при создании
}

    update(dt, player) {
        if (this.isDead || !world) return;

        // 1. Физика
        const MAX_FALL_SPEED = 25; 
        this.velocityY = Math.min(this.velocityY + CONFIG.gravity, MAX_FALL_SPEED);
        
        const prevY = this.y;
        this.y += this.velocityY;
        this.onGround = false;

        if (this.y > 35000 || isNaN(this.y) || isNaN(this.x)) {
            this.x = player.x + 300; 
            this.y = world.getHeight(this.x) - 200;
            this.velocityY = 0;
        }
        
        this.checkWallCollisions('y', world);

        const groundY = world.getHeight(this.x + this.width / 2, true); 
        const bottomY = this.y + this.height;
        const prevBottomY = prevY + this.height;
        const crossedGround = (prevBottomY <= groundY && bottomY >= groundY);
        const isInsideGround = (bottomY > groundY && bottomY - groundY < 300);

        if (this.velocityY >= 0 && (crossedGround || isInsideGround)) {
            this.y = groundY - this.height;
            this.velocityY = 0;
            this.onGround = true;
        }

        // 2. Движение по X и предотвращение "лунной походки"
        this.isBlocked = false;
        const prevX = this.x; // Запоминаем X до шага
        this.x += this.velocityX;
        this.checkWallCollisions('x', world);
        
        // НОВОЕ: Считаем, насколько гигант РЕАЛЬНО сдвинулся
        const actualDx = this.x - prevX; 
        // Если мы на земле, двигаем анимацию ног пропорционально пройденному расстоянию
        if (this.onGround && this.state !== 'attack' && this.state !== 'stomp') {
            this.walkCycle += Math.abs(actualDx) * 0.03; 
        }

        // 3. ЛОГИКА ИИ
        const dx = player.x - this.x;
        const dy = (player.y + player.size/2) - (this.y + this.height/2); 
        const wideDist = Math.abs(dx);

        if (this.state !== 'attack' && this.state !== 'stomp' && this.ignorePlayerTimer <= 0) {
            this.facing = dx > 0 ? 1 : -1;
        }

        if (this.ignorePlayerTimer > 0) {
            this.ignorePlayerTimer--;
            this.state = 'idle'; // Пока игнорирует - стоит
            this.velocityX = 0;
        } else {
            if (this.state === 'stomp') {
                 this.stompTimer++;
                 this.velocityX = 0; 
            } else if (this.state === 'attack') {
                 this.attackTimer++;
                 this.velocityX = 0; 
                 if (this.attackTimer > 120) { 
                     this.state = 'idle';
                     this.attackTimer = 0;
                 }
            } else {
                 if (wideDist < this.stompRange && dy > this.height*0.6) {
                     this.state = 'stomp';
                     this.stompTimer = 0;
                     this.liftLeg = (this.parts.legR.angle < 0); 
                 } else if (wideDist < this.attackRange && dy < this.height*0.4) {
                     this.state = 'attack';
                     this.attackTimer = 0;
                 } else if (wideDist < this.detectionRange) {
                     this.state = 'chase';
                     this.velocityX = this.facing * this.speed * 2.5;
                 } else {
                     // НОВОЕ: Игрока нет рядом — стоим на месте (убрали патруль)
                     this.state = 'idle';
                     this.velocityX = 0;
                 }
            }
        }

        if (this.state === 'chase' && this.isBlocked) {
            this.blockedTimer++;
            if (this.blockedTimer % 80 === 0) { 
                 this.state = 'attack';
                 this.attackTimer = 0;
            }
            if (this.blockedTimer > 300) {
                 this.ignorePlayerTimer = 400; 
                 this.blockedTimer = 0;
                 this.state = 'idle';
                 this.velocityX = 0;
            }
        } else if (this.state !== 'chase' && this.state !== 'attack') {
            this.blockedTimer = 0; 
        }

 
        // 4. Обновление физических хитбоксов и анимации
        this.animateParts(dt, player);
        this.updateHitboxes(); 

        // --- НОВОЕ: Прыжки на голову ---
        const head = this.headHitbox;
        // Проверяем: игрок падает вниз + он находится над головой по горизонтали
        if (player.velocityY > 0 && 
            player.x + player.size > head.x && 
            player.x < head.x + head.width &&
            player.y + player.size > head.y && 
            player.y + player.size < head.y + head.height + 20) {
            
            // Если игрок коснулся макушки:
            this.takeDamage(20); // Наносим 20 урона гиганту
            player.velocityY = -12; // Игрок подпрыгивает от головы
            player.onGround = false;
            
            // Визуальный эффект (опционально): можно добавить тряску или частицы
            console.log("Бум! По голове!");
        }
        
        // НОВОЕ: Проверяем, задели ли мы игрока руками или ногами
        this.checkPlayerCollision(player); 
    }
    
    // НОВОЕ: Метод для расчета реальных хитбоксов в зависимости от поворота
updateHitboxes() {
        // 1. Уязвимая зона (голова)
        this.headHitbox = this.getPartHitbox(this.parts.head);
        
        // 2. Тело (просто чтобы было, если захочешь добавить столкновения с телом)
        this.bodyHitbox = this.getPartHitbox(this.parts.body);

        // 3. Опасные зоны: чем босс бьет (собираем точные размеры)
        this.damageHitboxes = [
            this.getPartHitbox(this.parts.legL),
            this.getPartHitbox(this.parts.legR),
            this.getPartHitbox(this.parts.footL),
            this.getPartHitbox(this.parts.footR),
            this.getPartHitbox(this.parts.armL),
            this.getPartHitbox(this.parts.armR),
            this.getPartHitbox(this.parts.fistL),
            this.getPartHitbox(this.parts.fistR)
        ];
    }
    checkPlayerCollision(player) {
        // Если игрок мертв или в бессмертии после удара - игнорируем
        if (!player || player.hp <= 0 || player.invulnerableTimer > 0) return;

        // Координаты и размер игрока (используем player.size)
        const playerRect = {
            x: player.x,
            y: player.y,
            width: player.size,
            height: player.size
        };

        // Проверяем каждую опасную часть тела босса
        for (let hb of this.damageHitboxes) {
            if (
                playerRect.x < hb.x + hb.width &&
                playerRect.x + playerRect.width > hb.x &&
                playerRect.y < hb.y + hb.height &&
                playerRect.y + playerRect.height > hb.y
            ) {
                // Если коснулось - наносим урон (например 1 HP)
                player.takeDamage(1);
                break; // Выходим из цикла, чтобы не нанести урон 5 раз за один кадр
            }
        }
    }
    // НОВОЕ: Переопределяем метод получения урона (Пример)
    // Твоя система боевки в player.js должна вызывать этот метод
    takeDamage(amount, attackRect) {
        // Если переданы координаты удара игрока
        if (attackRect) {
            // Проверяем, пересекается ли удар с ГОЛОВОЙ
            const hit = (
                attackRect.x < this.headHitbox.x + this.headHitbox.width &&
                attackRect.x + attackRect.width > this.headHitbox.x &&
                attackRect.y < this.headHitbox.y + this.headHitbox.height &&
                attackRect.y + attackRect.height > this.headHitbox.y
            );
            
            // Если по голове не попали - игнорируем урон!
            if (!hit) return; 
        }
        
        // Если попали - отнимаем ХП
        this.health -= amount;
        if (this.health <= 0) this.isDead = true;
    }

    checkWallCollisions(axis, world) {
        if (!world || !world.chunkManager || !world.chunkManager.chunks) return;
        const chunkId = world.chunkManager.getChunkId(this.x);
        const chunk = world.chunkManager.chunks.get(chunkId);
        if (!chunk || !chunk.objects) return;

        for (let obj of chunk.objects) {
            if (obj.type !== "dungeon_wall" && obj.type !== "village_wall") continue;

            if (
                this.x < obj.x + obj.width &&
                this.x + this.width > obj.x &&
                this.y < obj.y + obj.height && 
                this.y + this.height > obj.y 
            ) {
                if (axis === 'x') {
                    if (this.velocityX > 0) {
                        this.x = obj.x - this.width;
                    } else if (this.velocityX < 0) {
                        this.x = obj.x + obj.width;
                    }
                    this.velocityX = 0;
                    this.isBlocked = true; 
                }
                
                if (axis === 'y') {
                    if (this.velocityY > 0) { 
                        this.y = obj.y - this.height; 
                        this.velocityY = 0;
                        this.onGround = true; 
                    } else if (this.velocityY < 0) { 
                        this.y = obj.y + obj.height;
                        this.velocityY = 0;
                    }
                }
            }
        }
    }

    animateParts(dt, player) {
        this.animTime += 0.04; 
        const t = this.animTime;
        const s = this.state;

        const neckY = this.y + this.parts.body.oy - 46; 
        const localDx = (player.x - this.x) * this.facing;
        const dy = (player.y + player.size/2) - neckY;
        const dist = Math.abs(player.x - this.x);
        
        let targetGaze = 0;
        if (dist < 500 && s !== 'stomp' && this.ignorePlayerTimer <= 0) {
            targetGaze = Math.atan2(dy, localDx);
            targetGaze = Math.max(-0.6, Math.min(0.6, targetGaze));
        }
        
        if (this.parts.head.currentAngle === undefined) this.parts.head.currentAngle = 0;
        this.parts.head.currentAngle += (targetGaze - this.parts.head.currentAngle) * 0.1;
        this.parts.head.angle = this.parts.head.currentAngle;

        let legSwing = 0;
        let armSwing = 0;
        let bodyBob = 0;
        let bodyTilt = 0;

        this.parts.legL.oy = 126;
        this.parts.legR.oy = 126;

        if (s === 'chase') {
            // ИСПОЛЬЗУЕМ walkCycle ВМЕСТО ВРЕМЕНИ!
            const cycle = this.walkCycle; 
            legSwing = Math.sin(cycle) * 0.6; 
            
            const liftL = Math.max(0, Math.sin(cycle));
            const liftR = Math.max(0, -Math.sin(cycle));
            this.parts.legL.oy = 126 - liftL * 15; 
            this.parts.legR.oy = 126 - liftR * 15; 
            
            armSwing = Math.cos(cycle) * 0.4;
            bodyBob = Math.abs(Math.sin(cycle)) * 3; 
            bodyTilt = 0.15;
        } else if (s === 'idle') {
            bodyBob = Math.sin(t * 0.5) * 2; // Медленное дыхание грудью
            armSwing = Math.cos(t * 0.5) * 0.05;
        }

        if (s !== 'stomp' && s !== 'attack') {
            this.parts.legL.angle = legSwing;
            this.parts.legR.angle = -legSwing;
            this.parts.armL.angle = -armSwing;
            this.parts.armR.angle = armSwing;
            this.parts.fistL.angle = 0;
            this.parts.fistR.angle = 0;
            this.parts.body.oy = bodyBob;
            this.parts.body.angle = bodyTilt;
        }

        if (s === 'attack') {
            const p = this.attackTimer; 
            if (p < 50) {
                const progress = p / 50; 
                this.parts.armL.angle = progress * 1.5; 
                this.parts.armR.angle = progress * 1.5;
                this.parts.fistL.angle = progress * 0.5;
                this.parts.fistR.angle = progress * 0.5;
                this.parts.body.angle = -progress * 0.2; 
                this.parts.body.oy = -progress * 10; 
            } else if (p < 60) {
                const progress = (p - 50) / 10;
                this.parts.armL.angle = 1.5 - (progress * 3.5); 
                this.parts.armR.angle = 1.5 - (progress * 3.5);
                this.parts.fistL.angle = 0.5 - progress;
                this.parts.fistR.angle = 0.5 - progress;
                this.parts.body.angle = -0.2 + (progress * 0.6); 
                this.parts.body.oy = -10 + (progress * 25); 
            } else if (p < 90) {
                const progress = (p - 60) / 30;
                this.parts.armL.angle = -2.0 * (1 - progress);
                this.parts.armR.angle = -2.0 * (1 - progress);
                this.parts.body.angle = 0.4 * (1 - progress);
                this.parts.body.oy = 15 * (1 - progress);
            } else {
                this.parts.armL.angle = 0;
                this.parts.armR.angle = 0;
                this.parts.body.angle = 0;
                this.parts.body.oy = 0;
            }
            this.parts.legL.angle = 0.3;
            this.parts.legR.angle = -0.3;
        }

        if (s === 'stomp') {
             const legToLift = this.liftLeg ? this.parts.legL : this.parts.legR;
             if (this.stompTimer < 5) {
                 this.parts.legL.angle = 0;
                 this.parts.legR.angle = 0;
                 legToLift.angle = -1.2;
                 this.parts.body.oy = -15; 
             } else if (this.stompTimer < 40) {
                 this.parts.body.oy = -20;
             } else if (this.stompTimer < 60) {
                 legToLift.angle = 0.5;
                 this.parts.body.oy = +15; 
             } else if (this.stompTimer < 80) {
                 legToLift.angle = 0;
                 this.parts.body.oy = 0;
             } else {
                 this.stompTimer = 0;
                 this.state = 'idle'; 
             }
        }

        this.attachChild(this.parts.legL, this.parts.footL);
        this.attachChild(this.parts.legR, this.parts.footR);
        this.attachChild(this.parts.armL, this.parts.fistL);
        this.attachChild(this.parts.armR, this.parts.fistR);
    }

    attachChild(parent, child) {
        const parentJointX = parent.ox + parent.w*parent.px;
        const parentJointY = parent.oy + parent.h*parent.py;
        const lengthRatio = (1 - parent.py); 
        const boneLength = parent.h * lengthRatio;
        const EX = parentJointX + Math.sin(-parent.angle) * boneLength;
        const EY = parentJointY + Math.cos(parent.angle) * boneLength;
        const childDrawX = EX - child.w*child.px;
        const childDrawY = EY - child.h*child.py;

        child.ox = childDrawX;
        child.oy = childDrawY;
        child.angle = parent.angle * 0.3; 
    }
    // НОВОЕ: Универсальный калькулятор точных хитбоксов для любой части тела
    getPartHitbox(part) {
        // Центр вращения (по локальным координатам)
        const cx = part.ox + (part.w * part.px);
        const cy = part.oy + (part.h * part.py);

        // Четыре угла картинки относительно центра вращения
        const corners = [
            { x: -part.w * part.px, y: -part.h * part.py },
            { x: part.w * (1 - part.px), y: -part.h * part.py },
            { x: part.w * (1 - part.px), y: part.h * (1 - part.py) },
            { x: -part.w * part.px, y: part.h * (1 - part.py) }
        ];

        // Синус и косинус для текущего угла поворота части тела
        const cos = Math.cos(part.angle || 0);
        const sin = Math.sin(part.angle || 0);

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        // Вращаем углы и находим крайние точки (AABB)
        for (let c of corners) {
            // Поворот
            const rx = c.x * cos - c.y * sin;
            const ry = c.x * sin + c.y * cos;

            // Возвращаем в локальные координаты
            const lx = cx + rx;
            const ly = cy + ry;

            // Учитываем разворот босса (facing) и переводим в мировые координаты
            const worldX = this.facing === 1 ? this.x + lx : this.x - lx;
            const worldY = this.y + ly;

            if (worldX < minX) minX = worldX;
            if (worldX > maxX) maxX = worldX;
            if (worldY < minY) minY = worldY;
            if (worldY > maxY) maxY = worldY;
        }

        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    draw(ctx) {
        if (this.isDead) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.facing, 1); 

        const order = ["legL", "footL", "armL", "fistL", "body", "head", "legR", "footR", "armR", "fistR"];
        
        order.forEach(key => {
            const part = this.parts[key];
            const img = assets[part.name];
            
            ctx.save();
            const jX = part.ox + (part.w * part.px);
            const jY = part.oy + (part.h * part.py);
            
            ctx.translate(jX, jY);
            ctx.rotate(part.angle || 0);
            
            const dX = -(part.w * part.px);
            const dY = -(part.h * part.py);

            if (img && img.complete) {
                ctx.drawImage(img, dX, dY, part.w, part.h);
            } else {
                ctx.fillStyle = "rgba(255, 0, 255, 0.4)";
                ctx.fillRect(dX, dY, part.w, part.h);
            }
            ctx.restore();
        });

        ctx.restore();
        this.drawHealthBar(ctx);
        
        // --- ДЕБАГ ХИТБОКСА (Удали потом) ---
        // ctx.strokeStyle = "yellow";
        // ctx.strokeRect(this.headHitbox.x, this.headHitbox.y, this.headHitbox.width, this.headHitbox.height);
    this.drawHealthBar(ctx);
        
        // --- ДЕБАГ ХИТБОКСА (Потом просто удали или закомментируй) ---
        ctx.lineWidth = 2;
        
        // Красный - Голова (Сюда бить)
        ctx.strokeStyle = "red";
        ctx.strokeRect(this.headHitbox.x, this.headHitbox.y, this.headHitbox.width, this.headHitbox.height);
        
        // Синий - Тело
        ctx.strokeStyle = "blue";
        ctx.strokeRect(this.bodyHitbox.x, this.bodyHitbox.y, this.bodyHitbox.width, this.bodyHitbox.height);

        // Желтый - Руки и Ноги (Они наносят урон)
        ctx.strokeStyle = "yellow";
        for (let hb of this.damageHitboxes) {
            ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
        }
    }

    drawHealthBar(ctx) {
        const barW = 120;
        const x = this.x - barW / 2;
        const y = this.y - 180;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(x - 2, y - 2, barW + 4, 10);
        ctx.fillStyle = "red";
        ctx.fillRect(x, y, barW, 6);
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(x, y, barW * (this.health / this.maxHealth), 6);
    }
}