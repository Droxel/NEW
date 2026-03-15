import { Mob } from "./Mob.js";
import { cameraX, cameraY } from "../../core/Braw.js";

// src/entities/mobs/JungleSkeleton.js

export class JungleSkeleton extends Mob {
    constructor(x, y) {
        super(x, y);
        this.hp = 2;
        this.width = 50;
        this.height = 50;
        
        // --- НОВОЕ: Рандомизация поведения ---
        this.speed = 1.5 + Math.random() * 1.5; // Скорость от 1.5 до 3
        this.jumpForce = 7 + Math.random() * 4; // Сила прыжка от 7 до 11
        this.jumpProbability = 0.02 + Math.random() * 0.03; // Шанс прыгнуть просто так
        
        this.image = new Image();
        this.image.src = "assets/images/entities/mobs/skeletjungey.png"; 

        this.jumpCooldown = 0;
        this.aggroRange = 600;
    }

    update(dt, player, allMobs) {
        super.update(dt, player, allMobs);
        if (this.isDead) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.aggroRange) {
            // Двигаемся к игроку
            this.velocityX += Math.sign(dx) * 0.2;
            
            // Ограничиваем максимальную скорость
            if (Math.abs(this.velocityX) > this.speed) {
                this.velocityX = Math.sign(this.velocityX) * this.speed;
            }

            // --- УЛУЧШЕННЫЙ ПРЫЖОК ---
            // Прыгаем если: игрок выше нас ИЛИ мы застряли перед стеной ИЛИ просто рандомно
            const isPlayerAbove = dy < -50;
            const isClose = dist < 200;

            if (this.onGround && this.jumpCooldown <= 0) {
                if ((isClose && isPlayerAbove) || Math.random() < this.jumpProbability) {
                    this.velocityY = -this.jumpForce;
                    // При прыжке даем дополнительный импульс в сторону игрока
                    this.velocityX += Math.sign(dx) * 3; 
                    this.jumpCooldown = 60 + Math.random() * 60;
                }
            }
        }
        
        if (this.jumpCooldown > 0) this.jumpCooldown--;
    }

draw(ctx) {
        // УБРАЛИ - cameraX и - cameraY
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = "white"; // Фолбек, если картинка не прогрузилась
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}