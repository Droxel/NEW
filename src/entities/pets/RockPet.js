// src/entities/pets/RockPet.js
import { world } from "../../world/World.js";

export class RockPet {
    constructor(x, y, data = {}) {
        this.x = x;
        this.y = y;
        this.vy = 0;
        
        this.points = data.points || null;
        this.rotation = data.rotation || 0;
        this.scale = data.scale || 1;
        this.baseScale = data.scale || 1;
        
        this.stretchX = 1;
        this.stretchY = 1;
        this.pupilScale = 1.0;
        this.blinkTimer = 0;
        this.isFlying = false;
        this.happiness = 0;
        this.lookAtX = 0;
        this.lookAtY = 0;

        this.idleTimer = 0;
        this.boredActionTimer = 0;
        this.currentTrick = null;
        this.trickTime = 0;
        this.isSleeping = false;
        
        // Новое для милоты
        this.isWinking = false; 
    }

    update(dt, player, droppedItems) {
        const groundY = world.getHeight(this.x) + 15; 
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        
        // Сбор камней
        if (droppedItems) {
            droppedItems.forEach(drop => {
                const itemId = drop.itemData?.id || drop.id || drop.item?.id;
                if (itemId === 'stone' && !drop.pickedUp) {
                    const d = Math.hypot(this.x - drop.x, this.y - drop.y);
                    if (d < 40) {
                        drop.pickedUp = true;
                        this.happiness = 5.0; // Продлил эффект счастья
                        this.vy = -8; // Прыжок повыше
                        this.wakeUp();
                    }
                }
            });
        }

        // Логика полета и земли
        const heightDiff = groundY - player.y;
        if (heightDiff > 250 || dist > 600) { 
            this.isFlying = true;
            this.wakeUp();
        } else if (dist < 100 && Math.abs(this.y - groundY) < 15) {
            if (this.isFlying) { this.stretchX = 1.4; this.stretchY = 0.6; }
            this.isFlying = false;
        }

        // Таймер безделья
        if (dist < 150 && !this.isFlying && Math.abs(this.vy) < 0.1) {
            this.idleTimer += 1;
        } else {
            if (this.idleTimer > 180) this.vy = -3;
            this.wakeUp();
        }

        // Физика и трюки
        if (this.isFlying) {
            const targetX = player.x + (player.flipX ? 50 : -50);
            const targetY = player.y - 20;
            this.x += (targetX - this.x) * 0.07;
            this.y += (targetY - this.y) * 0.07;
            this.rotation *= 0.9; 
        } else {
            if (this.y < groundY) {
                this.vy += 0.5;
                this.y += this.vy;
            } else {
                this.y = groundY;
                if (this.vy > 1) { this.stretchX = 1.3; this.stretchY = 0.7; }
                this.vy = 0;

                if (this.idleTimer > 180 && !this.isSleeping) {
                    this.boredActionTimer -= 1;
                    if (this.idleTimer > 1200) this.isSleeping = true;

                    if (this.boredActionTimer <= 0) {
                        const tricks = ['wiggle', 'hop', 'look_around', 'spin'];
                        this.currentTrick = tricks[Math.floor(Math.random() * tricks.length)];
                        this.boredActionTimer = 120 + Math.random() * 200;
                        this.trickTime = 0;
                        if (this.currentTrick === 'hop') { this.vy = -4; this.stretchX = 0.8; this.stretchY = 1.2; }
                    }
                    this.trickTime += 1;
                    this.executeTricks();
                }
            }

            if (dist > 80 && !this.isSleeping) {
                const moveDist = (player.x - this.x);
                this.x += moveDist * (dist > 200 ? 0.09 : 0.05);
                this.rotation += moveDist * 0.003;
            }
        }

        this.applyVisuals(dist, player);
    }

    wakeUp() {
        this.idleTimer = 0;
        this.currentTrick = null;
        this.isSleeping = false;
        this.isWinking = false;
    }

    executeTricks() {
        if (this.currentTrick === 'wiggle') {
            this.rotation = Math.sin(this.trickTime * 0.15) * 0.2;
        } else if (this.currentTrick === 'spin') {
            this.rotation += 0.25;
        } else if (this.currentTrick === 'look_around') {
            this.lookAtX = Math.sin(this.trickTime * 0.1) * 5;
            this.lookAtY = Math.cos(this.trickTime * 0.1) * 2;
        }
    }

    applyVisuals(dist, player) {
        this.stretchX += (1 - this.stretchX) * 0.15;
        this.stretchY += (1 - this.stretchY) * 0.15;

        if (!this.isSleeping && this.currentTrick !== 'look_around') {
            const angle = Math.atan2(player.y - this.y, player.x - this.x) - this.rotation;
            this.lookAtX = Math.cos(angle) * 1.8;
            this.lookAtY = Math.sin(angle) * 1.8;
        }

        // Чем ближе игрок, тем больше зрачки (эффект обожания)
        const targetPupil = (dist < 100) ? 1.8 : 1.1;
        this.pupilScale += (targetPupil - this.pupilScale) * 0.1;
        
        if (this.happiness > 0) this.happiness -= 0.02;
        
        this.blinkTimer += 1;
        if (this.blinkTimer > 250) {
            this.blinkTimer = 0;
            this.isWinking = Math.random() > 0.8; // 20% шанс подмигнуть
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Мягкое покачивание вверх-вниз, если счастлив
        const hover = this.happiness > 0 ? Math.sin(Date.now() * 0.01) * 2 : 0;
        ctx.translate(0, hover);
        
        ctx.scale(this.baseScale * this.stretchX, this.baseScale * this.stretchY);
        
        // Тело
        ctx.fillStyle = "#A0A0A0";
        ctx.strokeStyle = "#555";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (this.points) {
            ctx.moveTo(this.points[0].x, this.points[0].y);
            this.points.forEach(p => ctx.lineTo(p.x, p.y));
        } else {
            ctx.ellipse(0, -5, 16, 12, 0, 0, Math.PI * 2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        this.drawFace(ctx);
        ctx.restore();
    }

    drawFace(ctx) {
        const eyeX = 6.5;
        const eyeY = -9;

        // 1. РУМЯНЕЦ (Пульсирующие щечки)
        if (this.happiness > 0.1 || this.idleTimer > 180) {
            ctx.save();
            const pulse = Math.sin(Date.now() * 0.006) * 0.2 + 0.8;
            ctx.globalAlpha = Math.min(this.happiness + 0.3, 0.8) * pulse;
            ctx.fillStyle = "#FFB3BA";
            ctx.beginPath();
            ctx.ellipse(-eyeX - 3, eyeY + 6, 4, 2, 0, 0, Math.PI * 2);
            ctx.ellipse(eyeX + 3, eyeY + 6, 4, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (this.isSleeping) {
            ctx.strokeStyle = "#444";
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            // Глазки "спящие" (u u)
            ctx.beginPath();
            ctx.arc(-eyeX, eyeY, 3, 0.2, Math.PI - 0.2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(eyeX, eyeY, 3, 0.2, Math.PI - 0.2);
            ctx.stroke();
            return;
        }

        const isBlinking = this.blinkTimer > 235;

        // Рисуем глаза
        [1, -1].forEach(side => {
            const isThisEyeWinking = isBlinking && (this.isWinking ? side === 1 : true);
            const x = eyeX * side;

            if (isThisEyeWinking) {
                // Зажмуренный глаз
                ctx.strokeStyle = "#222";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(x - 4, eyeY); ctx.lineTo(x + 4, eyeY);
                ctx.stroke();
            } else {
                // Белок
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(x, eyeY, 5.5, 0, Math.PI * 2);
                ctx.fill();

                // Зрачок
                ctx.fillStyle = "#111";
                const pSize = 2.2 * this.pupilScale;
                ctx.beginPath();
                ctx.arc(x + this.lookAtX, eyeY + this.lookAtY, pSize, 0, Math.PI * 2);
                ctx.fill();

                // СУПЕР-БЛИКИ (то самое "ути-пути")
                ctx.fillStyle = "white";
                // Основной большой блик
                ctx.beginPath();
                ctx.arc(x + this.lookAtX - 1.5, eyeY + this.lookAtY - 1.5, 1.8, 0, Math.PI * 2);
                ctx.fill();
                // Маленький "искрящийся" блик снизу
                ctx.beginPath();
                ctx.arc(x + this.lookAtX + 1.8, eyeY + this.lookAtY + 1.5, 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // 2. МАЛЕНЬКИЙ РОТИК (v-образный)
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        if (this.happiness > 1) {
            // Улыбка дугой, если очень рад
            ctx.arc(0, eyeY + 4, 3, 0.2, Math.PI - 0.2);
        } else {
            // Маленький "v" ротик
            ctx.moveTo(-1.5, eyeY + 4);
            ctx.lineTo(0, eyeY + 5.5);
            ctx.lineTo(1.5, eyeY + 4);
        }
        ctx.stroke();
    }
}