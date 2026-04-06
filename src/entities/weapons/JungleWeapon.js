/* src/entities/weapons/JungleWeapon.js */
import { mobManager } from "../../entities/mobs/MobManager.js";
import { bossManager } from "../../entities/bosses/BossManager.js";
import { audioManager } from "../../core/AudioManager.js";

export class JungleWeapon {
    constructor(player) {
        this.player = player;
        this.x = player.x;
        this.y = player.y;
        
        this.state = 'FOLLOW'; 
        this.targetEnemy = null;
        this.enemiesInArea = [];
        
        // Настройки Клыка Джунглей
        this.speed = 0.15; // Плавный полет
        this.timer = 0;
        this.cooldown = 0;
        
        // Летает чуть сзади и сверху
        this.idleOffsetX = -30;
        this.idleOffsetY = -50;

        // Эффекты и сущности атаки
        this.particles = [];
        this.clouds = [];      // Облака яда
        this.portals = [];     // Зеленые спирали-порталы
        this.projectiles = []; // Колючки из порталов
    }

    update(weaponItem) {
        if (!weaponItem) return;

        this.timer++;
        if (this.cooldown > 0) this.cooldown--;
        
        this.updateEffects(weaponItem);

        // Поиск целей каждые 20 кадров
        if (this.state === 'FOLLOW' && this.timer % 20 === 0) {
            this.findTargets();
            this.decideNextAttack();
        }

        switch (this.state) {
            case 'FOLLOW':
                this.handleFollowState();
                break;
            case 'BASIC_ATTACK':
                this.handleBasicAttack(weaponItem);
                break;
            case 'POISON_ATTACK':
                this.handlePoisonAttack(weaponItem);
                break;
            case 'PORTAL_STORM':
                this.handlePortalStorm(weaponItem);
                break;
        }
    }

    handleFollowState() {
        // Плавное парение за игроком (без жесткой тряски)
        let hoverY = Math.sin(this.timer * 0.05) * 10; 
        
        let targetX = this.player.x + this.idleOffsetX;
        let targetY = this.player.y + this.idleOffsetY + hoverY;

        this.x += (targetX - this.x) * this.speed;
        this.y += (targetY - this.y) * this.speed;

        // Редкие капли яда при простое
        if (Math.random() < 0.05) this.spawnPoisonDrop(this.x, this.y);
    }

    handleBasicAttack(weaponItem) {
        if (!this.targetEnemy || this.targetEnemy.isAlive === false) {
            this.state = 'FOLLOW';
            return;
        }

        let targetX = this.targetEnemy.x + (this.targetEnemy.width / 2 || 0);
        let targetY = this.targetEnemy.y + (this.targetEnemy.height / 2 || 0);

        // Летим к врагу
        this.x += (targetX - this.x) * 0.3;
        this.y += (targetY - this.y) * 0.3;

        let dist = Math.hypot(targetX - this.x, targetY - this.y);
        if (dist < 30) {
            if (this.targetEnemy.takeDamage) this.targetEnemy.takeDamage(weaponItem.damage);
            
            this.cooldown = 30; // Стандартная пауза
            this.state = 'FOLLOW';
        }
    }

    handlePoisonAttack(weaponItem) {
        if (!this.targetEnemy || this.targetEnemy.isAlive === false) {
            this.state = 'FOLLOW';
            return;
        }

        let targetX = this.targetEnemy.x + (this.targetEnemy.width / 2 || 0);
        let targetY = this.targetEnemy.y + (this.targetEnemy.height / 2 || 0);

        this.x += (targetX - this.x) * 0.35;
        this.y += (targetY - this.y) * 0.35;

        let dist = Math.hypot(targetX - this.x, targetY - this.y);
if (dist < 30) {
    if (this.targetEnemy.takeDamage) this.targetEnemy.takeDamage(weaponItem.damage);

    // Запускаем звук и сохраняем его в переменную
    let gasSound = null;
    if (audioManager && typeof audioManager.playSFX === 'function') {
        // Начальная громкость 0.2 (тише)
        gasSound = audioManager.playSFX('strikes/gas.wav', 0.2); 
    }

    this.clouds.push({
        x: targetX,
        y: targetY,
        life: 180,
        maxLife: 180, // Добавили для расчета затухания
        radius: 60,   // Чуть меньше начальный радиус
        damage: weaponItem.damage * 0.2,
        sound: gasSound // Сохраняем ссылку на звук
    });

    this.cooldown = 50; 
    this.state = 'FOLLOW';
}
    }

    handlePortalStorm(weaponItem) {
        if (!this.targetEnemy || this.targetEnemy.isAlive === false) {
            this.state = 'FOLLOW';
            return;
        }

        // Подлетаем вверх над врагом
        let targetX = this.targetEnemy.x + (this.targetEnemy.width / 2 || 0);
        let targetY = this.targetEnemy.y - 100;

        this.x += (targetX - this.x) * 0.15;
        this.y += (targetY - this.y) * 0.15;

        // Когда заняли позицию
        if (this.timer === 40) {
            // Звук портала
            if (audioManager && typeof audioManager.playSFX === 'function') {
                audioManager.playSFX('strikes/portal.wav', 0.5); 
            }

            // Спавним 2 или 3 портала
            let portalCount = Math.random() > 0.5 ? 3 : 2;
            for (let i = 0; i < portalCount; i++) {
                let angle = (Math.PI * 2 / portalCount) * i;
                this.portals.push({
                    x: targetX + Math.cos(angle) * 80,
                    y: targetY + Math.sin(angle) * 80 + 50,
                    life: 150,
                    shootTimer: 0
                });
            }
        }

        // Заканчиваем каст через 60 кадров
        if (this.timer > 60) {
            this.cooldown = 180; // Очень долгий кулдаун, так как атака имбовая
            this.state = 'FOLLOW';
        }
    }

    findTargets() {
        this.enemiesInArea = [];
        this.targetEnemy = null;
        let searchRadius = 350; 
        let minDistanceSq = searchRadius * searchRadius;

        // Поиск обычных мобов
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

        // Поиск боссов (приоритет)
        if (bossManager && bossManager.boss && bossManager.boss.isAlive) {
            let distSq = this.getDistSq(bossManager.boss);
            if (distSq < searchRadius * searchRadius) {
                this.enemiesInArea.push(bossManager.boss);
                this.targetEnemy = bossManager.boss;
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

        this.timer = 0; 
        let rand = Math.random(); 

        // БАЛАНС:
        // 60% - Обычный удар
        // 30% - Удар с ядом
        // 10% - Порталы (ИМБА)
        if (rand < 0.10) {
            this.state = 'PORTAL_STORM';
        } else if (rand < 0.40) {
            this.state = 'POISON_ATTACK';
        } else {
            this.state = 'BASIC_ATTACK';
        }
    }

    updateEffects(weaponItem) {
        // --- Обновление Облаков яда ---
for (let i = this.clouds.length - 1; i >= 0; i--) {
    let c = this.clouds[i];
    c.life--;
    c.radius += 0.15;

    // Плавное затухание звука
    if (c.sound) {
        let volumeProgress = c.life / c.maxLife; 
        c.sound.volume = Math.max(0, volumeProgress * 0.2); // 0.2 — это макс. громкость
        
        if (c.life <= 1) {
            c.sound.pause(); // Остановить звук в конце
        }
    }
            // Урон мобам внутри облака каждые 20 кадров
            if (c.life % 20 === 0 && mobManager && mobManager.mobs) {
                for (let mob of mobManager.mobs) {
                    let dist = Math.hypot(mob.x - c.x, mob.y - c.y);
                    if (dist < c.radius && mob.takeDamage) {
                        mob.takeDamage(c.damage);
                    }
                }
                // Проверка босса
                if (bossManager && bossManager.boss && bossManager.boss.isAlive) {
                    let dist = Math.hypot(bossManager.boss.x - c.x, bossManager.boss.y - c.y);
                    if (dist < c.radius && bossManager.boss.takeDamage) {
                        bossManager.boss.takeDamage(c.damage);
                    }
                }
            }

            // Спавн пузырьков в облаке
            if (Math.random() < 0.2) this.spawnPoisonDrop(c.x + (Math.random()-0.5)*c.radius, c.y + (Math.random()-0.5)*c.radius);

            if (c.life <= 0) this.clouds.splice(i, 1);
        }

        // --- Обновление Порталов ---
        for (let i = this.portals.length - 1; i >= 0; i--) {
            let p = this.portals[i];
            p.life--;
            p.shootTimer++;

            // Стреляем колючками по кругу каждые 30 кадров
            if (p.shootTimer % 30 === 0 && p.life > 20) {
                if (audioManager && typeof audioManager.playSFX === 'function') {
                    audioManager.playSFX('strikes/shot.wav', 0.2); 
                }
                // 8 колючек во все стороны
                for (let j = 0; j < 8; j++) {
                    let angle = (Math.PI / 4) * j;
                    this.projectiles.push({
                        x: p.x, y: p.y,
                        vx: Math.cos(angle) * 6,
                        vy: Math.sin(angle) * 6,
                        life: 60,
                        damage: weaponItem.damage * 0.6
                    });
                }
            }
            if (p.life <= 0) this.portals.splice(i, 1);
        }

        // --- Обновление Колючек (снарядов) ---
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let proj = this.projectiles[i];
            proj.x += proj.vx;
            proj.y += proj.vy;
            proj.life--;

            // Проверка попаданий по мобам
            let hit = false;
            if (mobManager && mobManager.mobs) {
                for (let mob of mobManager.mobs) {
                    if (Math.hypot(mob.x - proj.x, mob.y - proj.y) < 25) {
                        if (mob.takeDamage) mob.takeDamage(proj.damage);
                        hit = true;
                        break;
                    }
                }
            }
            // Проверка по боссу
            if (!hit && bossManager && bossManager.boss && bossManager.boss.isAlive) {
                if (Math.hypot(bossManager.boss.x - proj.x, bossManager.boss.y - proj.y) < 50) {
                    if (bossManager.boss.takeDamage) bossManager.boss.takeDamage(proj.damage);
                    hit = true;
                }
            }

            if (hit || proj.life <= 0) {
                // Пыль при попадании/исчезновении
                for(let k=0; k<3; k++) this.spawnPoisonDrop(proj.x, proj.y);
                this.projectiles.splice(i, 1);
            }
        }

        // --- Обновление обычных частиц ---
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    spawnPoisonDrop(px, py) {
        this.particles.push({
            x: px, y: py,
            vx: (Math.random() - 0.5),
            vy: (Math.random() - 0.5) - 1, // Летят слегка вверх
            life: Math.random() * 20 + 10,
            maxLife: 30,
            size: Math.random() * 3 + 2,
            color: Math.random() > 0.5 ? '#2ecc71' : '#27ae60' // Зеленые оттенки
        });
    }

    draw(ctx, assets, itemData) {
        if (!itemData || !itemData.id || !assets) return;

        // 1. Отрисовка Облаков яда
ctx.save();
for (let c of this.clouds) {
    let progress = c.life / c.maxLife;
    let alpha = progress * 0.5; // Прозрачность зависит от жизни

    // Создаем радиальный градиент для мягкости
    let grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.radius);
    grad.addColorStop(0, `rgba(46, 204, 113, ${alpha})`);   // Ярко-зеленый в центре
    grad.addColorStop(0.6, `rgba(39, 174, 96, ${alpha * 0.5})`); // Темнее к краям
    grad.addColorStop(1, `rgba(39, 174, 96, 0)`);           // Полная прозрачность на границе

    ctx.fillStyle = grad;
    
    // Рисуем несколько смещенных кругов, чтобы облако казалось "живым"
    for (let j = 0; j < 5; j++) {
        let offsetX = Math.cos(c.life * 0.02 + j) * 10;
        let offsetY = Math.sin(c.life * 0.02 + j) * 10;
        
        ctx.beginPath();
        ctx.arc(c.x + offsetX, c.y + offsetY, c.radius * (0.7 + j * 0.1), 0, Math.PI * 2);
        ctx.fill();
    }
}
ctx.restore();

        // 2. Отрисовка Порталов (зеленые спирали)
        for (let p of this.portals) {
            ctx.save();
            ctx.translate(p.x, p.y);
            let alpha = Math.min(1, p.life / 20);
            ctx.globalAlpha = alpha;
            
            ctx.rotate(p.life * 0.1); // Спираль крутится
            ctx.strokeStyle = "#27ae60";
            ctx.lineWidth = 4;
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#2ecc71";
            
            ctx.beginPath();
            for(let i=0; i<20; i++) {
                let angle = 0.5 * i;
                let r = 2 * i;
                if (i===0) ctx.moveTo(0,0);
                else ctx.lineTo(r*Math.cos(angle), r*Math.sin(angle));
            }
            ctx.stroke();
            ctx.restore();
        }

        // 3. Отрисовка Колючек
        ctx.save();
        for (let proj of this.projectiles) {
            ctx.translate(proj.x, proj.y);
            let angle = Math.atan2(proj.vy, proj.vx);
            ctx.rotate(angle);
            
            ctx.fillStyle = "#145a32"; // Темно-зеленый
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-5, 5);
            ctx.lineTo(-5, -5);
            ctx.fill();
            
            ctx.rotate(-angle);
            ctx.translate(-proj.x, -proj.y);
        }
        ctx.restore();

        // 4. Отрисовка самого Клыка
        ctx.save();
        ctx.translate(this.x, this.y);

        let dx = this.targetEnemy ? this.targetEnemy.x - this.x : this.player.x - this.x;

        if (this.state === 'BASIC_ATTACK' || this.state === 'POISON_ATTACK') {
            let dy = this.targetEnemy ? this.targetEnemy.y - this.y : 0;
            let angle = Math.atan2(dy, dx);
            ctx.rotate(angle + Math.PI/4); 
            
            if (dx < 0) ctx.scale(1, -1);
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#2ecc71";
        } else {
            // Плавное покачивание в простое
            ctx.rotate(Math.sin(this.timer * 0.05) * 0.1); 
            if (dx < 0) ctx.scale(-1, 1); // Смотрит в сторону движения/игрока
        }

        const imgId = itemData.id || 'wpn_jungle';
        const img = assets[imgId];
        const size = 80;

        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, -size/2, -size/2, size, size);
        } else {
            // Заглушка, если svg еще не подгрузился
            ctx.fillStyle = "#27ae60";
            ctx.beginPath();
            ctx.moveTo(0, -size/2);
            ctx.lineTo(size/4, size/2);
            ctx.lineTo(-size/4, size/2);
            ctx.fill();
        }
        ctx.restore();

        // 5. Отрисовка капель яда (частиц)
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