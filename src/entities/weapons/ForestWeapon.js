/* src/entities/weapons/ForestWeapon.js */
import { mobManager } from "../../entities/mobs/MobManager.js";
import { bossManager } from "../../entities/bosses/BossManager.js";
import { audioManager } from "../../core/AudioManager.js";

export class ForestWeapon {
    constructor(player) {
        this.player = player;
        this.x = player.x;
        this.y = player.y;
        
        this.state = 'FOLLOW'; 
        this.targetEnemy = null;
        
        // Настройки массивности
        this.speed = 0.04;        // Чуть медленнее тащится (тяжелый)
        this.smashSpeed = 25;     // Падает очень быстро
        this.aoeRadius = 180;     // Радиус удара стал больше
        
        this.timer = 0;
        this.targetY = 0; 

        // Система частиц для магии леса
        this.particles = [];
    }

    update(weaponItem) {
        if (!weaponItem) return;

        this.timer++;
        
        // --- Обновление магических частиц ---
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // --- Генерация частиц ауры (светлячки/листья) ---
        if (Math.random() < 0.4 && this.state !== 'RECOVER') {
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * 60,
                y: this.y + (Math.random() - 0.5) * 60,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1 - 0.5, // Слегка летят вверх
                life: Math.random() * 20 + 20,
                maxLife: 40,
                size: Math.random() * 4 + 2,
                color: Math.random() > 0.5 ? '#2ecc71' : '#f1c40f' // Зеленый или золотой
            });
        }

        if (this.state === 'FOLLOW' && this.timer % 30 === 0) {
            this.findTarget();
        }

        switch (this.state) {
            case 'FOLLOW':
                let offsetX = this.player.scaleX > 0 ? -70 : 70; // Отдалил немного из-за размера
                let hover = Math.sin(this.timer * 0.04) * 15; // Более амплитудное покачивание
                
                this.x += ((this.player.x + offsetX) - this.x) * this.speed;
                this.y += ((this.player.y - 50 + hover) - this.y) * this.speed;

                if (this.targetEnemy && this.targetEnemy.isAlive !== false) {
                    this.state = 'PREPARE';
                    this.timer = 0;
                }
                break;

            case 'PREPARE':
                if (!this.targetEnemy || this.targetEnemy.isAlive === false) {
                    this.state = 'FOLLOW';
                    break;
                }

                let enemyCX = this.targetEnemy.x + (this.targetEnemy.width / 2 || 0);
                let overEnemyY = this.targetEnemy.y - 180; // Поднимается выше для сильного удара

                this.x += (enemyCX - this.x) * 0.08; 
                this.y += (overEnemyY - this.y) * 0.04; // Тяжело поднимается вверх

                if (Math.abs(this.x - enemyCX) < 20 && Math.abs(this.y - overEnemyY) < 20) {
                    this.state = 'SMASH';
                    this.targetY = this.targetEnemy.y + (this.targetEnemy.height / 2 || 0);
                }
                break;

            case 'SMASH':
                this.y += this.smashSpeed;

                if (this.y >= this.targetY) {
                    this.doSplashDamage(weaponItem.damage);
                    this.state = 'RECOVER';
                    this.timer = 0;

                    // ЗВУК ТЕПЕРЬ ТИШЕ (0.15)
                    if (audioManager && typeof audioManager.playSFX === 'function') {
                        audioManager.playSFX('strikes/hit.wav', 0.15); 
                    }

                    // --- Взрыв лесных частиц при ударе ---
                    for(let i = 0; i < 30; i++) {
                        let angle = Math.random() * Math.PI * 2;
                        let speed = Math.random() * 8 + 2;
                        this.particles.push({
                            x: this.x, 
                            y: this.y + 40, // От точки соприкосновения с землей
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            life: 30,
                            maxLife: 30,
                            size: Math.random() * 6 + 3,
                            color: Math.random() > 0.3 ? '#27ae60' : '#8e44ad' // Лесная магия
                        });
                    }
                }
                break;

            case 'RECOVER':
                // Лежит на земле дольше, так как тяжелый
                if (this.timer > 80) {
                    this.targetEnemy = null;
                    this.state = 'FOLLOW';
                }
                break;
        }
    }

    doSplashDamage(baseDamage) {
        if (mobManager && mobManager.mobs) {
            for (let mob of mobManager.mobs) {
                let dx = mob.x - this.x;
                let dy = mob.y - this.y;
                if (dx*dx + dy*dy <= this.aoeRadius * this.aoeRadius) {
                    if (mob.takeDamage) mob.takeDamage(baseDamage);
                }
            }
        }

        if (bossManager && bossManager.boss && bossManager.boss.isAlive) {
            let b = bossManager.boss;
            let dx = b.x - this.x;
            let dy = b.y - this.y;
            if (dx*dx + dy*dy <= this.aoeRadius * this.aoeRadius) {
                if (b.takeDamage) b.takeDamage(baseDamage);
            }
        }
    }

    findTarget() {
        let nearest = null;
        let minDistanceSq = 160000; 

        if (mobManager && mobManager.mobs) {
            for (let mob of mobManager.mobs) {
                let dx = mob.x - this.player.x;
                let dy = mob.y - this.player.y;
                let distSq = dx*dx + dy*dy;
                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    nearest = mob;
                }
            }
        }
        this.targetEnemy = nearest;
    }

    draw(ctx, assets, itemData) {
        if (!itemData || !itemData.id || !assets) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);

        // --- Отрисовка магической ауры (свечение) ---
        if (this.state === 'PREPARE') {
            ctx.rotate((Math.random() - 0.5) * 0.1); // Сильно дрожит от напряжения
            ctx.shadowBlur = 30;
            ctx.shadowColor = "#2ecc71";
        } else if (this.state === 'SMASH') {
            ctx.rotate(Math.PI / 4); 
            ctx.shadowBlur = 50; // Во время удара ярко светится
            ctx.shadowColor = "#f1c40f";
        } else if (this.state === 'RECOVER') {
            ctx.rotate(Math.PI / 2);
            ctx.shadowBlur = 0; // Магия гаснет
        } else {
            ctx.rotate(Math.sin(this.timer * 0.04) * 0.15); 
            ctx.shadowBlur = 15; // Легкое свечение в покое
            ctx.shadowColor = "#2ecc71";
        }

        const imgId = itemData ? itemData.id : 'wpn_forest';
        const img = assets[imgId];
        const size = 120; // УВЕЛИЧИЛИ РАЗМЕР

        if (!img || !img.complete || img.naturalWidth === 0) {
            ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
            ctx.fillRect(-size/2, -size/2, size, size);
        } else {
            ctx.drawImage(img, -size/2, -size/2, size, size);
        }
        
        // Сбрасываем тени, чтобы они не применялись к остальному
        ctx.shadowBlur = 0; 
        ctx.restore();

        // --- Отрисовка эффекта удара (Волна друидов) ---
        if (this.state === 'RECOVER' && this.timer < 30) {
            let progress = this.timer / 30; // От 0 до 1
            // Плавное расширение
            let currentRadius = this.aoeRadius * (1 - Math.pow(1 - progress, 3)); 

            ctx.save();
            ctx.translate(this.x, this.y + 40); // Волна идет от нижней части молота
            ctx.globalAlpha = 1 - progress;
            
            // Внутреннее толстое зеленое кольцо
            ctx.strokeStyle = "#2ecc71";
            ctx.lineWidth = 15 * (1 - progress);
            ctx.beginPath();
            ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Внешнее тонкое золотистое кольцо (летит чуть быстрее)
            ctx.strokeStyle = "#f1c40f";
            ctx.lineWidth = 5 * (1 - progress);
            ctx.beginPath();
            ctx.arc(0, 0, currentRadius * 1.2, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }

        // --- Отрисовка частиц ---
        ctx.save();
        for (let p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}