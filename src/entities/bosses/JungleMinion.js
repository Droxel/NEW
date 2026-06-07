// JungleMinion.js
import { Mob } from "../mobs/Mob.js";             // Поднимаемся в entities, идем в mobs
import { CONFIG } from "../../data/config.js";
import { world } from "../../world/World.js";
import { cameraX, cameraY } from "../../core/Braw.js";

export class JungleMinion extends Mob {
    constructor(x, y, isPhase2 = false) {
        super(x, y);
        
        // Настройки по ТЗ
        this.hp = isPhase2 ? 1 : 3;
        this.maxHp = this.hp;
        
        // Скорость
        this.baseSpeed = isPhase2 ? 2.5 : 1.5;
        this.speed = this.baseSpeed;
        
        this.width = 44;
        this.height = 44;
        
        // Текстура
        this.image = new Image();
        this.image.src = "./assets/images/entities/bosses/kyk.png";
        
        // Логика поведения
        this.jumpCooldown = 0; // Задержка между прыжками
        this.aggroRange = 600; // Дистанция, когда начинает идти
        this.leapRange = 120;  // Дистанция, когда начинает прыгать
    }

    update(dt, player) {
        // Базовая физика (гравитация и т.д. из Mob)
        super.update(dt, player);

        if (this.isDead) return;

        const dx = player.x - this.x;
        const absDist = Math.abs(dx);
        const direction = Math.sign(dx);

        // 1. ИИ: Движение к игроку
        if (absDist < this.aggroRange && absDist > 10) {
            // Если мы на земле, идем к игроку
            if (this.onGround) {
                this.velocityX = direction * this.speed;
            }
        } else {
            this.velocityX *= 0.9;
        }

        // 2. ИИ: Агрессивный прыжок (напрыгивание)
        if (this.jumpCooldown > 0) this.jumpCooldown--;

        if (absDist < this.leapRange && this.onGround && this.jumpCooldown <= 0) {
            // Прыгаем
            this.velocityY = -9; // Высота прыжка
            this.velocityX = direction * (this.speed * 2.5); // Резкий рывок вперед
            this.jumpCooldown = 80; // Пауза перед следующим прыжком
        }
        
        // 3. Обработка столкновений
        if (this.checkCollision(player)) {
            this.handlePlayerCollision(player);
        }
    }

    checkCollision(player) {
        return (player.x < this.x + this.width &&
                player.x + player.size > this.x &&
                player.y < this.y + this.height &&
                player.y + player.size > this.y);
    }

    handlePlayerCollision(player) {
        // Определяем, прыгнул ли игрок сверху
        // Условие: Игрок падает вниз (velocityY > 0) И ноги игрока выше центра миньона
        const isStomp = player.velocityY > 0 && (player.y + player.size) < (this.y + this.height * 0.8);

        if (isStomp) {
            // --- ИГРОК ПОБЕДИЛ (Прыжок сверху) ---
            player.velocityY = -10; // Игрок отпрыгивает вверх
            this.takeDamage(100);   // Миньон умирает
            // Урон игроку НЕ наносится
        } else {
            // --- ИГРОК ПОЛУЧАЕТ УРОН (Обычное касание) ---
            player.takeDamage(1);
            
            // Отталкивание игрока
            player.velocityX = Math.sign(player.x - this.x) * 6;
            player.velocityY = -4;
            
            // Миньон умирает при атаке (камикадзе)
            this.takeDamage(100); 
        }
    }

draw(ctx) {
    // ВАЖНО: Больше не вычитаем cameraX/Y, так как в braw.js есть ctx.translate
    const drawX = this.x;
    const drawY = this.y;

    if (this.image.complete && this.image.naturalWidth > 0) {
        ctx.drawImage(this.image, drawX, drawY, this.width, this.height);
    } else {
        // Теперь, если картинка не найдена, ты увидишь этот квадрат!
        ctx.fillStyle = "#55aa55";
        ctx.fillRect(drawX, drawY, this.width, this.height);
    }
    
    // HP Bar
    if (this.hp < this.maxHp) {
        ctx.fillStyle = "red";
        ctx.fillRect(drawX, drawY - 5, this.width, 3);
        ctx.fillStyle = "lime";
        ctx.fillRect(drawX, drawY - 5, (this.hp / this.maxHp) * this.width, 3);
    }
}
}