/* src/entities/Bubble.js */
import { mobManager } from "../../mobs/MobManager.js";
import { bossManager } from "../../bosses/BossManager.js";

export class Bubble {
    constructor(player) {
        this.player = player;
        this.x = player.x;
        this.y = player.y;
        this.size = 40;
        
        this.floatTimer = 0;
        this.attackTimer = 0;
        this.attackCooldown = 60;

        this.state = 'IDLE';
        this.targetEnemy = null;
        this.lungeSpeed = 0.2;
        this.returnSpeed = 0.1;

        // ОПТИМИЗАЦИЯ: Ищем цель не каждый кадр, а раз в 10 кадров
        this.searchTimer = 0;
        this.searchInterval = 10; 
    }

    update(weaponItem) {
        this.floatTimer += 0.05;

        if (this.state === 'IDLE') {
            // ОПТИМИЗАЦИЯ: Троттлинг поиска цели
            this.searchTimer++;
            if (this.searchTimer >= this.searchInterval) {
                this.findTarget();
                this.searchTimer = 0;
            }
            
            if (weaponItem && weaponItem.damage && this.targetEnemy) {
                this.attackTimer++;
                if (this.attackTimer >= this.attackCooldown) {
                    this.state = 'LUNGE';
                    this.attackTimer = 0;
                }
            }
            
            const hover = Math.sin(this.floatTimer) * 8;
            let targetX = this.player.x + (this.player.size / 2) + (this.player.scaleX > 0 ? -40 : 40);
            let targetY = this.player.y - 50 + hover;
            
            this.x += (targetX - this.x) * 0.1;
            this.y += (targetY - this.y) * 0.1;

        } else if (this.state === 'LUNGE') {
            if (!this.targetEnemy || this.targetEnemy.isDead || this.targetEnemy.isAlive === false) {
                this.state = 'RETURNING';
                return;
            }

            const enemyCX = this.targetEnemy.x + (this.targetEnemy.width / 2 || 0);
            const enemyCY = this.targetEnemy.y + (this.targetEnemy.height / 2 || 0);

            this.x += (enemyCX - this.x) * this.lungeSpeed;
            this.y += (enemyCY - this.y) * this.lungeSpeed;

            // ОПТИМИЗАЦИЯ: используем сравнение квадратов расстояний (быстрее, чем Math.hypot)
            const dx = enemyCX - this.x;
            const dy = enemyCY - this.y;
            if (dx*dx + dy*dy < 400) { // 20 * 20 = 400
                if (this.targetEnemy.takeDamage) {
                    this.targetEnemy.takeDamage(weaponItem.damage);
                }
                this.state = 'RETURNING';
            }

        } else if (this.state === 'RETURNING') {
            let targetX = this.player.x + (this.player.size / 2);
            let targetY = this.player.y - 40;

            this.x += (targetX - this.x) * this.returnSpeed;
            this.y += (targetY - this.y) * this.returnSpeed;

            const dx = targetX - this.x;
            const dy = targetY - this.y;
            if (dx*dx + dy*dy < 900) { // 30 * 30 = 900
                this.state = 'IDLE';
            }
        }
    }

    findTarget() {
        let nearest = null;
        let minDistanceSq = 90000; // 300 * 300 (квадрат радиуса)

        // ОПТИМИЗАЦИЯ: не используем Math.hypot (корень) внутри циклов
        if (mobManager && mobManager.mobs) {
            for (let i = 0; i < mobManager.mobs.length; i++) {
                const mob = mobManager.mobs[i];
                const dx = mob.x - this.player.x;
                const dy = mob.y - this.player.y;
                const distSq = dx*dx + dy*dy;
                
                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    nearest = mob;
                }
            }
        }

        if (bossManager && bossManager.boss && bossManager.boss.isAlive) {
            const b = bossManager.boss;
            const dx = b.x - this.player.x;
            const dy = b.y - this.player.y;
            const distSq = dx*dx + dy*dy;
            if (distSq < minDistanceSq) {
                nearest = b;
            }
        }

        this.targetEnemy = nearest;
    }

draw(ctx, assets, itemInBubble) {
    ctx.save();
    
    const pulse = this.state === 'LUNGE' ? 1.2 : 1.0;
    const currentSize = this.size * pulse;

    ctx.globalAlpha = 0.6;

    // Проверка самого пузыря: добавлена проверка на naturalWidth
    if (assets.bubble && assets.bubble.complete && assets.bubble.naturalWidth > 0) {
        ctx.drawImage(assets.bubble, this.x - currentSize/2, this.y - currentSize/2, currentSize, currentSize);
    } else {
        // Запасной вариант, если спрайт пузыря не прогрузился
        ctx.fillStyle = "rgba(0, 200, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Проверка предмета внутри
    if (itemInBubble && itemInBubble.id) {
        const itemImg = assets[itemInBubble.id];
        
        // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: добавляем проверку на naturalWidth > 0
        if (itemImg && itemImg.complete && itemImg.naturalWidth > 0) {
            ctx.globalAlpha = 1.0;
            ctx.translate(this.x, this.y);
            
            const rotSpeed = this.state === 'LUNGE' ? 10 : 1;
            ctx.rotate(Math.sin(this.floatTimer * rotSpeed) * 0.3);
            
            const itemSize = currentSize * 0.6;
            ctx.drawImage(itemImg, -itemSize/2, -itemSize/2, itemSize, itemSize);
        } else {
            // Можно добавить лог, чтобы понять, какой именно предмет сломался
            // console.warn(`Картинка для предмета ${itemInBubble.id} не загружена или битая`);
        }
    }

    ctx.restore();
}
}