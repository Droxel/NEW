// IceProjectiles.js
import { CONFIG } from "../../../data/config.js";
import { world } from "../../../world/World.js";
import { assets } from "../../../core/AssetLoader.js";
import { audioManager } from "../../../core/AudioManager.js";

// --- СОСУЛЬКА ---
export class Icicle {
    constructor(x, y, targetX = null, targetY = null, accuracy = 1.0) {
        this.x = x;
        this.y = y;
        this.damage = 1; 
        this.isAlive = true;
        
        this.scale = 0.7 + Math.random() * 0.6; 
        this.width = 10 * this.scale;
        this.height = 30 * this.scale;
        
        // Новые свойства для зависания и разбития
        this.isHovering = false; 
        this.hoverAngle = 0; 
        this.isShattered = false;    // Состояние "Разбита"
        this.shatterFrames = 15;     // Длительность анимации осколков (в кадрах)

        if (targetX !== null) {
            this.setTarget(targetX, targetY, accuracy);
        } else {
            this.vx = 0;
            this.vy = 6 + Math.random() * 5; 
        }
    }

    setTarget(targetX, targetY, accuracy = 1.0) {
        const spreadX = (Math.random() - 0.5) * 40 * (1 - accuracy);
        const spreadY = (Math.random() - 0.5) * 40 * (1 - accuracy);
        
        const dx = (targetX + spreadX) - this.x;
        const dy = (targetY + spreadY) - this.y;
        const dist = Math.hypot(dx, dy);
        
        const speed = 12 + Math.random() * 3;
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;
        
        this.isHovering = false; // Когда получаем цель - снимаем с "паузы"
    }

update(player) {
    if (this.isShattered) {
        this.shatterFrames--;
        if (this.shatterFrames <= 0) this.isAlive = false;
        return;
    }

        if (this.isHovering) return; // Пока висим - не двигаемся

        this.x += this.vx;
        this.y += this.vy;
        
        // --- НОВАЯ ЛОГИКА КОЛЛИЗИИ С ИГРОКОМ ---
if (player) {
        const distToPlayer = Math.hypot(player.x - this.x, (player.y - player.size / 2) - this.y);
        const hitRadius = (this.width / 2) + (player.size / 2);

        if (distToPlayer < hitRadius) {
            player.takeDamage(this.damage);
            this.isShattered = true;
            // Хруст при попадании в игрока
            audioManager.playSFX('boss/ice_boss/crunch.wav', 0.1);
            return;
        }
    }

    const groundY = world.getHeight(this.x);
    if (this.y + this.height/2 >= groundY) {
        this.isShattered = true;
        this.y = groundY - this.height/2;
        // Хруст при ударе о землю
        audioManager.playSFX('boss/ice_boss/crunch.wav', 0.2);
    }
}

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // --- ОТРИСОВКА ОСКОЛКОВ ---
        if (this.isShattered) {
            const progress = 1 - (this.shatterFrames / 15); // Значение от 0 до 1
            ctx.fillStyle = "#aee5ff";
            ctx.globalAlpha = 1 - progress; // Осколки плавно исчезают
            
            // Рисуем 3 разлетающихся кусочка льда
            ctx.fillRect(-15 * progress, -5 + 15 * progress, 4, 4); // Левый
            ctx.fillRect(15 * progress, -5 + 15 * progress, 4, 4);  // Правый
            ctx.fillRect(0, -20 * progress, 5, 5);                  // Верхний
            
            ctx.restore();
            return; // Дальше целую сосульку не рисуем
        }

        // --- МАГИЯ ПОВОРОТА ДЛЯ ЦЕЛОЙ СОСУЛЬКИ ---
        if (!this.isHovering) {
            const angle = Math.atan2(this.vy, this.vx);
            ctx.rotate(angle + Math.PI / 2);
        } else {
            // Если висит вокруг кристалла, направляем её острием наружу
            ctx.rotate(this.hoverAngle + Math.PI / 2); 
        }

        if (assets.icicle && assets.icicle.complete) {
            ctx.drawImage(assets.icicle, -this.width/2, -this.height/2, this.width, this.height);
        } else {
            ctx.fillStyle = "#aee5ff";
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        }
        ctx.restore();
    }
}

// --- ЛЕДЯНАЯ ГЛЫБА ---
export class IceBlock {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4; // Начальный небольшой разброс в бока
        this.vy = 0;
        this.damage = 3; 
        this.isAlive = true;
        
        // --- РАЗНООБРАЗИЕ РАЗМЕРОВ ---
        // Используем Math.pow, чтобы маленькие выпадали часто, а гигантские — редко
        const sizeRand = Math.pow(Math.random(), 2); 
        this.size = 30 + sizeRand * 120; // От 30 до 150 пикселей!
        
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.onGround = false;
        
        // Время жизни глыбы как препятствия (в кадрах)
        this.lifeTime = 400 + Math.random() * 300; 
        this.friction = 0.95; // Трение при качении
    }

    update(player) {
        // 1. Гравитация
        this.vy += CONFIG.gravity * 0.8;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed * (Math.abs(this.vx) + 1);

        // 2. Коллизия с землей
        const groundY = world.getHeight(this.x);
    if (this.y + this.size/2 >= groundY) {
        // Проверяем, был ли это сильный удар о землю
        if (this.vy > 5 && !this.onGround) {
            audioManager.playSFX('boss/ice_boss/fallen_stone.wav', 0.1);
        }
            this.y = groundY - this.size/2;
            
            // Если упала с большой скоростью — отскакивает
            if (this.vy > 5) {
                this.vy *= -0.3; 
            } else {
                this.vy = 0;
                this.onGround = true;
            }

            // --- ЛОГИКА СКАТЫВАНИЯ ---
            // Проверяем высоту слева и справа, чтобы понять наклон
            const checkDist = 10;
            const hLeft = world.getHeight(this.x - checkDist);
            const hRight = world.getHeight(this.x + checkDist);
            const slope = hRight - hLeft;

            // Если есть наклон — придаем ускорение в сторону низины
            this.vx += slope * 0.05; 
            this.vx *= this.friction; // Применяем трение
        }

        // 3. ПРЕПЯТСТВИЕ ДЛЯ ИГРОКА
const distToPlayer = Math.hypot(player.x - this.x, (player.y - player.size/2) - this.y);
    const minDist = (this.size / 2) + (player.size / 2);

    if (distToPlayer < minDist) {
        // Если глыба врезалась в игрока (и она тяжелая)
        if (Math.abs(this.vy) > 2 || Math.abs(this.vx) > 2) {
            // Используем crunch2 для тяжелого столкновения
            audioManager.playSFX('boss/ice_boss/crunch2.wav', 0.2);
        }
        
        if (Math.abs(this.vy) > 5 && !this.onGround) {
            player.takeDamage(this.damage);
        }

            // Работаем как твердое тело (выталкиваем игрока)
            const angle = Math.atan2((player.y - player.size/2) - this.y, player.x - this.x);
            const pushForce = 1.5;
            player.x += Math.cos(angle) * pushForce;
            player.velocityX += Math.cos(angle) * 0.5;
        }

        // 4. Жизненный цикл
        this.lifeTime--;
        if (this.lifeTime <= 0) {
            this.isAlive = false; // Глыба "тает" или разрушается
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Эффект таяния (становится прозрачной в конце жизни)
        if (this.lifeTime < 60) ctx.globalAlpha = this.lifeTime / 60;

        if (assets.ice_block && assets.ice_block.complete) {
            ctx.drawImage(assets.ice_block, -this.size/2, -this.size/2, this.size, this.size);
        } else {
            ctx.fillStyle = "#82c8e5";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
        }
        ctx.restore();
    }
}
// --- МОРОЗНОЕ ОБЛАКО ---
export class FreezeCloud {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.timeLeft = 180; // Сделал 3 секунды (при 60 FPS), чтобы не бесило слишком долго
        this.radius = 90;
        this.isAlive = true;
        this.pulse = 0;
    }

    update(player) {
        this.timeLeft--;
        if (this.timeLeft <= 0) this.isAlive = false;
        this.pulse += 0.1;

        const dist = Math.hypot(player.x - this.x, player.y - (this.y - 20));
        if (dist < this.radius) {
            player.velocityX *= 0.1; 
            // Не обнуляем Y полностью, чтобы игрок мог падать, но медленно (эффект желе)
            if (player.velocityY < 0) player.velocityY *= 0.5; 
        }
    }

    draw(ctx) {
        const currentRadius = this.radius + Math.sin(this.pulse) * 5; // Пульсация
        ctx.globalAlpha = (this.timeLeft / 180) * 0.6;
        
        const gradient = ctx.createRadialGradient(this.x, this.y - 20, 0, this.x, this.y - 20, currentRadius);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(1, "rgba(130, 200, 229, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 20, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}