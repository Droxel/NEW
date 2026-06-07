/* src/entities/weapons/DesertWeapon.js */
import { mobManager } from "../../entities/mobs/MobManager.js";
import { bossManager } from "../../entities/bosses/BossManager.js";
import { audioManager } from "../../core/AudioManager.js";

export class DesertWeapon {
    constructor(player) {
        this.player = player;
        this.x = player.x;
        this.y = player.y;
        
        this.state = 'RESTLESS'; 
        this.targetEnemy = null;
        this.enemiesInArea = [];
        
        // Настройки ниндзя-клинка
        this.speed = 0.25;         // Очень быстрый (в 6 раз быстрее молота)
        this.timer = 0;
        this.cooldown = 0;
        
        // Для неугомонного поведения
        this.idleOffsetX = 0;
        this.idleOffsetY = -40;

        // Эффекты
        this.particles = [];
        this.slashes = [];   // Полосы от ульты
        this.tornadoes = []; // Активные торнадо
    }

    update(weaponItem) {
        if (!weaponItem) return;

        this.timer++;
        if (this.cooldown > 0) this.cooldown--;
        
        this.updateEffects();

        // Поиск целей каждые 15 кадров (очень быстрый отклик)
        if (this.state === 'RESTLESS' && this.timer % 15 === 0) {
            this.findTargets();
            this.decideNextAttack();
        }

        switch (this.state) {
            case 'RESTLESS':
                this.handleRestlessState();
                break;

            case 'PIERCE':
                this.handlePierceState(weaponItem);
                break;

            case 'ULTRA_SLASH':
                this.handleUltraSlashState(weaponItem);
                break;

            case 'TORNADO_SPIN':
                this.handleTornadoState(weaponItem);
                break;
        }
    }

    // --- ЛОГИКА СОСТОЯНИЙ ---

    handleRestlessState() {
        // Каждые 8 кадров меняем точку, куда летит клинок (эффект "ерзания")
        if (this.timer % 8 === 0) {
            this.idleOffsetX = (Math.random() - 0.5) * 120;
            this.idleOffsetY = (Math.random() - 0.5) * 80 - 40;
        }
        
        let targetX = this.player.x + this.idleOffsetX;
        let targetY = this.player.y + this.idleOffsetY;

        this.x += (targetX - this.x) * this.speed;
        this.y += (targetY - this.y) * this.speed;

        // Рандомные песчинки в простое
        if (Math.random() < 0.2) this.spawnSandParticle(this.x, this.y);
    }

    handlePierceState(weaponItem) {
        if (!this.targetEnemy || this.targetEnemy.isAlive === false) {
            this.state = 'RESTLESS';
            return;
        }

        let targetX = this.targetEnemy.x + (this.targetEnemy.width / 2 || 0);
        let targetY = this.targetEnemy.y + (this.targetEnemy.height / 2 || 0);

        // Клинок летит точно во врага очень быстро
        this.x += (targetX - this.x) * 0.4;
        this.y += (targetY - this.y) * 0.4;

        this.spawnSandParticle(this.x, this.y, true); // След от рывка

        // Проверка столкновения
        let dist = Math.hypot(targetX - this.x, targetY - this.y);
        if (dist < 30) {
            if (this.targetEnemy.takeDamage) this.targetEnemy.takeDamage(weaponItem.damage);
            
            if (audioManager && typeof audioManager.playSFX === 'function') {
                audioManager.playSFX('strikes/wave.wav', 0.2); 
            }
            
            this.cooldown = 20; // Небольшая пауза перед следующим ударом
            this.state = 'RESTLESS';
        }
    }

    handleUltraSlashState(weaponItem) {
        // Режим берсерка: хаотичные разрезы по всем врагам вокруг
        if (this.timer % 4 === 0 && this.enemiesInArea.length > 0) {
            // Выбираем случайного врага из толпы
            let randomEnemy = this.enemiesInArea[Math.floor(Math.random() * this.enemiesInArea.length)];
            
            if (randomEnemy && randomEnemy.isAlive !== false) {
                let eX = randomEnemy.x + (randomEnemy.width / 2 || 0);
                let eY = randomEnemy.y + (randomEnemy.height / 2 || 0);

                // Добавляем визуальную полосу разреза
                this.slashes.push({
                    x1: this.x, y1: this.y,
                    x2: eX, y2: eY,
                    life: 15, maxLife: 15
                });

                // Мгновенно перемещаемся к нему
                this.x = eX;
                this.y = eY;

                if (randomEnemy.takeDamage) randomEnemy.takeDamage(weaponItem.damage * 0.7); // Чуть меньше урона, но много хитов
                
                // Звук волны/разреза
                if (audioManager && typeof audioManager.playSFX === 'function') {
                    audioManager.playSFX('strikes/wave.wav', 0.15); 
                }
            }
        }

        // Заканчиваем ульту через 40 кадров
        if (this.timer > 40) {
            this.cooldown = 60; 
            this.state = 'RESTLESS';
        }
    }

    handleTornadoState(weaponItem) {
        // Клинок летит в центр толпы и начинает крутиться
        let centerX = this.enemiesInArea.reduce((sum, e) => sum + e.x, 0) / this.enemiesInArea.length;
        let centerY = this.enemiesInArea.reduce((sum, e) => sum + e.y, 0) / this.enemiesInArea.length;

        // Если только начали - летим в центр
        if (this.timer < 20) {
            this.x += (centerX - this.x) * 0.2;
            this.y += (centerY - this.y) * 0.2;
        } else if (this.timer === 20) {
            // Спавним торнадо
            this.tornadoes.push({
                x: this.x, y: this.y,
                life: 180, // Живет 3 секунды
                radius: 200, // Радиус засасывания
                damage: weaponItem.damage * 0.2 // Периодический урон
            });

            if (audioManager && typeof audioManager.playSFX === 'function') {
                audioManager.playSFX('strikes/vortex.wav', 0.4); 
            }
        } else {
            // Крутимся вокруг центра торнадо
            let angle = this.timer * 0.5; // Очень быстрое вращение
            this.x = centerX + Math.cos(angle) * 40;
            this.y = centerY + Math.sin(angle) * 40;
            this.spawnSandParticle(this.x, this.y, true);
        }

        // Заканчиваем через секунду, оставляя торнадо жить своей жизнью
        if (this.timer > 60) {
            this.cooldown = 120; // Долгий кулдаун на торнадо
            this.state = 'RESTLESS';
        }
    }

    // --- ВСПОМОГАТЕЛЬНАЯ ЛОГИКА ---

    findTargets() {
        this.enemiesInArea = [];
        this.targetEnemy = null;
        let searchRadius = 300; 
        let minDistanceSq = searchRadius * searchRadius;

        // Ищем обычных мобов
        if (mobManager && mobManager.mobs) {
            for (let mob of mobManager.mobs) {
                let distSq = this.getDistSq(mob);
                if (distSq < searchRadius * searchRadius) {
                    this.enemiesInArea.push(mob);
                    if (distSq < minDistanceSq) {
                        minDistanceSq = distSq;
                        this.targetEnemy = mob;
                    }
                }
            }
        }

        // Ищем боссов
        if (bossManager && bossManager.boss && bossManager.boss.isAlive) {
            let distSq = this.getDistSq(bossManager.boss);
            if (distSq < searchRadius * searchRadius) {
                this.enemiesInArea.push(bossManager.boss);
                this.targetEnemy = bossManager.boss; // Босс в приоритете
            }
        }
    }

    getDistSq(entity) {
        let dx = entity.x - this.player.x;
        let dy = entity.y - this.player.y;
        return dx * dx + dy * dy;
    }

decideNextAttack() {
        if (this.enemiesInArea.length === 0 || this.cooldown > 0) return;

        this.timer = 0; // Сбрасываем таймер для нового стейта
        let rand = Math.random(); // Генерируем случайное число от 0 до 1

        // Если врагов 2 или больше - повышаем шанс на массовые атаки (Торнадо / Ульта)
        if (this.enemiesInArea.length >= 2) {
            if (rand < 0.4) {
                this.state = 'TORNADO_SPIN'; // 40% шанс на торнадо
            } else if (rand < 0.7) {
                this.state = 'ULTRA_SLASH';  // 30% шанс на ульту
            } else {
                this.state = 'PIERCE';       // 30% на обычный рывок
            }
        } else {
            // Если враг всего ОДИН, всё равно даем шанс увидеть крутые скиллы!
            if (rand < 0.15) {
                this.state = 'TORNADO_SPIN'; // 15% шанс
            } else if (rand < 0.3) {
                this.state = 'ULTRA_SLASH';  // 15% шанс
            } else {
                this.state = 'PIERCE';       // 70% обычный быстрый удар
            }
        }
    }

    // --- ВИЗУАЛ И ЭФФЕКТЫ ---

    updateEffects() {
        // Частицы
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Разрезы (Следы от ульты)
        for (let i = this.slashes.length - 1; i >= 0; i--) {
            this.slashes[i].life--;
            if (this.slashes[i].life <= 0) this.slashes.splice(i, 1);
        }

        // Торнадо (Засасывание и урон)
        for (let i = this.tornadoes.length - 1; i >= 0; i--) {
            let t = this.tornadoes[i];
            t.life--;

            // Засасываем мобов
            if (mobManager && mobManager.mobs) {
                for (let mob of mobManager.mobs) {
                    let dx = t.x - mob.x;
                    let dy = t.y - mob.y;
                    let dist = Math.hypot(dx, dy);
                    
                    if (dist < t.radius && dist > 10) { // Не засасываем в самую точку 0
                        mob.x += (dx / dist) * 2; // Сила тяги
                        mob.y += (dy / dist) * 2;
                        
                        // Периодический урон внутри вихря
                        if (t.life % 15 === 0 && mob.takeDamage) {
                            mob.takeDamage(t.damage);
                        }
                    }
                }
            }

            // Спавним пыль для торнадо
            for(let j = 0; j < 3; j++) {
                let angle = Math.random() * Math.PI * 2;
                let r = Math.random() * 60;
                this.spawnSandParticle(t.x + Math.cos(angle)*r, t.y + Math.sin(angle)*r, true);
            }

            if (t.life <= 0) this.tornadoes.splice(i, 1);
        }
    }

    spawnSandParticle(px, py, isFast = false) {
        this.particles.push({
            x: px + (Math.random() - 0.5) * 20,
            y: py + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * (isFast ? 4 : 1),
            vy: (Math.random() - 0.5) * (isFast ? 4 : 1) - 0.5,
            life: Math.random() * 15 + 10,
            maxLife: 25,
            size: Math.random() * 3 + 1,
            color: Math.random() > 0.5 ? '#e67e22' : '#f39c12' // Цвета песка
        });
    }

    draw(ctx, assets, itemData) {
        if (!itemData || !itemData.id || !assets) return;
        
        // 1. Отрисовка Торнадо (Вихри рисуются под клинком)
        for (let t of this.tornadoes) {
            ctx.save();
            ctx.translate(t.x, t.y);
            let alpha = Math.min(1, t.life / 30); // Плавное исчезновение
            ctx.globalAlpha = alpha * 0.6;
            
            ctx.rotate(t.life * 0.2); // Вращение самого вихря
            ctx.fillStyle = "#e67e22";
            ctx.beginPath();
            ctx.ellipse(0, 0, 80, 40, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = "#f39c12";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(0, 0, 100, 50, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // 2. Отрисовка линий от Ультра-разреза
        ctx.save();
        for (let s of this.slashes) {
            let progress = s.life / s.maxLife;
            ctx.globalAlpha = progress;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4 * progress;
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();
            
            // Внешнее свечение разреза
            ctx.strokeStyle = "#f39c12";
            ctx.lineWidth = 8 * progress;
            ctx.stroke();
        }
        ctx.restore();

// 3. Отрисовка самого клинка
        ctx.save();
        ctx.translate(this.x, this.y);

        // Узнаем, где находится цель или игрок относительно клинка
        let dx = this.targetEnemy ? this.targetEnemy.x - this.x : this.player.x - this.x;

        // Вращение и отзеркаливание в зависимости от стейта
        if (this.state === 'TORNADO_SPIN') {
            ctx.rotate(this.timer * 0.8); // Дикое вращение
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#e67e22";
            
        } else if (this.state === 'PIERCE' || this.state === 'ULTRA_SLASH') {
            let dy = this.targetEnemy ? this.targetEnemy.y - this.y : 0;
            let angle = Math.atan2(dy, dx);
            
            ctx.rotate(angle + Math.PI/4); // Направляем острие на врага
            
            // МАГИЯ 2D: Если летим влево (dx < 0), зеркалим по оси Y, 
            // чтобы клинок не смотрел рукоятью вперед или не был перевернут
            if (dx < 0) {
                ctx.scale(1, -1);
            }
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#ffffff";
            
        } else {
            // Дерганное вращение в покое (RESTLESS)
            ctx.rotate(Math.sin(this.timer * 0.5) * 0.2); 
            
            // Если игрок (или точка покоя) находится слева, отзеркаливаем сам спрайт
            if (dx < 0) {
                ctx.scale(-1, 1);
            }
        }

        const imgId = itemData.id || 'desert_knife';
        const img = assets[imgId];
        const size = 80; // Размер клинка

        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, -size/2, -size/2, size, size);
        } else {
            ctx.fillStyle = "rgba(230, 126, 34, 0.8)";
            ctx.fillRect(-size/2, -size/2, size, size);
        }
        ctx.restore();

        // 4. Отрисовка песчаных частиц
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