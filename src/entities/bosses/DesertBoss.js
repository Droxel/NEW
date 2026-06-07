//DesertBoss.js
import { CONFIG } from "../../data/config.js"; 
import { world } from "../../world/World.js";
import { Boss } from "./Boss.js";

// ==========================================================
// 🎛️ ПУЛЬТ УПРАВЛЕНИЯ БОССОМ (РЕЖИМ ХАРДКОР + БАЛАНС)
// ==========================================================
const BOSS_CONFIG = {
    stats: {
        hp: 40,
        size: 128,
        contactDamage: 2,
    },
    physics: {
        gravity: CONFIG.gravity,
        passivePushForce: 0.5,
        passivePushRange: 300, 
    },
    timers: {
        actionCooldown: 50,   // Чуть увеличил паузу (было 40)
        tiredTime: 120,
        rockLife: 300,        
    },
    attacks: {
        // 🔥 ИЗМЕНЕНИЕ: Глыб стало меньше
        rockCount: { min: 3, max: 5 }, // Было 4-7
        rockDelay: 350,       // Падают реже (было 200)
        
        tornadoSpeed: 6,
        tornadoDuration: 300, 
    }
};

export class DesertBoss extends Boss {
    constructor(x) {
        super({ x, y: 0, hp: BOSS_CONFIG.stats.hp });

        this.size = BOSS_CONFIG.stats.size;
        this.name = "Sand Dominator";

        this.image = new Image();
        this.image.src = "./assets/images/entities/bosses/Desertt.png";

        // Состояния
        this.state = 'spawn_anim'; 
        this.phase = 1;
        
        // Таймеры и счетчики
        this.timers = { 
            action: 60, 
            tired: 0,    
            invul: 0,    
            death: 0,
            flash: 0 
        };

        // 🔥 СЧЕТЧИК ПРЫЖКОВ НА ГОЛОВУ
        this.headHitCount = 0;

        // Объекты атак
        this.blocks = [];    
        this.tornadoes = []; 
        this.worms = [];     
        this.waves = []; // 🔥 Новая атака: Волны песка

        // Визуал
        this.scaleX = 0; 
        this.scaleY = 0;
        this.shake = 0;
        
        // Физика
        this.velocityY = 0;
    }

    // ========================================================================
    //                                ЛОГИКА
    // ========================================================================

    update(player) {
        // 1. Проверка фазы
        if (this.hp <= this.maxHp * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.shake = 30; 
            this.triggerShockwave(player); // При смене фазы откидываем волной
        }

        // 2. Смерть
        if (this.hp <= 0 && this.state !== 'dying') {
            this.state = 'dying';
            this.isAlive = false;
        }
        if (this.state === 'dying') {
            this.animateDeath();
            return;
        }

        // 3. Плавная анимация формы
        if (this.state !== 'spawn_anim' && this.state !== 'tired' && this.state !== 'rage' && this.state !== 'shockwave') {
            this.scaleX += (1 - this.scaleX) * 0.1;
            this.scaleY += (1 - this.scaleY) * 0.1;
        }

        // 4. Таймеры
        if (this.timers.invul > 0) this.timers.invul--;
        if (this.timers.flash > 0) this.timers.flash--;

        // 5. Физика
        this.applyPhysics();
        
        // 🌀 ПАССИВНЫЙ ВЕТЕР (Отключен пока босс устал или делает волну)
        if (this.state !== 'tired' && this.state !== 'spawn_anim' && this.state !== 'shockwave') {
            const dist = player.x - this.x;
            if (Math.abs(dist) < BOSS_CONFIG.physics.passivePushRange) {
                player.velocityX += Math.sign(dist) * BOSS_CONFIG.physics.passivePushForce;
            }
        }

        // 6. Обновление миньонов и атак
        this.updateAttacks(player);

        // 7. Машина состояний
        switch (this.state) {
            case 'spawn_anim': 
                this.scaleX += 0.02; this.scaleY += 0.02;
                if(this.scaleX >= 1) { this.scaleX=1; this.scaleY=1; this.state = 'idle'; }
                break;

            case 'idle':
                this.timers.action--;
                if (this.timers.action <= 0) {
                    this.state = 'prepare_attack';
                    this.timers.action = 30; 
                }
                break;

            case 'prepare_attack':
                this.shake = 5; 
                this.timers.flash = 2; 
                this.timers.action--;
                this.scaleY = 0.8; this.scaleX = 1.1;

                if (this.timers.action <= 0) {
                    this.chooseAttack(player);
                }
                break;

            case 'shockwave': // Состояние создания волны
                this.scaleX = 1.4; this.scaleY = 0.6; // Сплющился
                this.timers.flash = 5;
                if(this.timers.action > 0) this.timers.action--;
                else this.state = 'idle';
                break;

            case 'attacking':
                const attacksActive = this.blocks.length > 0 || this.tornadoes.length > 0 || this.worms.length > 0;
                if (!attacksActive) {
                    this.becomeTired();
                }
                break;

            case 'tired':
                this.timers.tired--;
                this.scaleY = 0.7; this.scaleX = 1.2;
                if (this.timers.tired <= 0) {
                    this.state = 'idle';
                    this.timers.action = BOSS_CONFIG.timers.actionCooldown;
                }
                break;
        }

        // 8. Коллизия с игроком
        this.checkBodyCollisions(player);
    }

    applyPhysics() {
        this.velocityY += BOSS_CONFIG.physics.gravity;
        this.y += this.velocityY;
        const groundY = world.getHeight(this.x);
        if (this.y > groundY + 10) { 
            this.y = groundY + 10; 
            this.velocityY = 0;
        }
    }

    // ========================================================================
    //                                СИСТЕМА АТАК
    // ========================================================================

    chooseAttack(player) {
        this.state = 'attacking';
        this.scaleX = 0.7; this.scaleY = 1.4;

        const rand = Math.random();

        if (this.phase === 2) {
            if (rand < 0.4) this.startAttack('tornado', player); // Чаще торнадо во 2 фазе
            else if (rand < 0.7) this.startAttack('worms', player);
            else this.startAttack('rocks', player);
        } else {
            if (rand < 0.5) this.startAttack('rocks', player);
            else this.startAttack('tornado', player);
        }
    }

    // 🔥 НОВАЯ ФУНКЦИЯ: УДАРНАЯ ВОЛНА ПЕСКА (Срабатывает на 3-й прыжок)
    triggerShockwave(player) {
        this.state = 'shockwave';
        this.timers.action = 20; // Пауза после волны
        this.shake = 20;
        
        // Создаем визуальную волну
        this.waves.push({
            x: this.x,
            y: this.y,
            radius: 10,
            opacity: 1.0,
            width: 10 // Толщина линии
        });

        // Физический толчок
        const dir = Math.sign(player.x - this.x) || 1;
        player.velocityX = dir * 25; // ОЧЕНЬ сильный толчок вбок
        player.velocityY = -12;      // Подбрасываем
        player.takeDamage(1);        // Небольшой урон песком
        
        console.log("BOOM! Shockwave triggered!");
    }

    startAttack(type, player) {
        if (!this.isAlive) return;

        switch(type) {
            case 'rocks':
                const count = Math.floor(Math.random() * (BOSS_CONFIG.attacks.rockCount.max - BOSS_CONFIG.attacks.rockCount.min + 1)) + BOSS_CONFIG.attacks.rockCount.min;
                this.spawnBlocks(player, count);
                break;
            case 'tornado':
                this.spawnTornado(player);
                break;
            case 'worms':
                this.spawnWorms(player, 4); 
                break;
        }
    }

    becomeTired() {
        this.state = 'tired';
        this.timers.tired = BOSS_CONFIG.timers.tiredTime;
    }

    // --- СПАВНЕРЫ ---

    spawnBlocks(player, count) {
        for(let i=0; i<count; i++) {
            setTimeout(() => {
                if(!this.isAlive) return;
                const offsetX = (Math.random() - 0.5) * 500; 
                const sizeMult = 0.8 + Math.random() * 0.8;
                const baseSize = 40;
                
                this.blocks.push({
                    x: player.x + offsetX,
                    y: player.y - 600, 
                    w: baseSize * sizeMult, 
                    h: baseSize * sizeMult,
                    damage: sizeMult > 1.2 ? 2 : 1, 
                    vy: 0,
                    state: 'falling',
                    life: BOSS_CONFIG.timers.rockLife,
                    angle: Math.random() * 6.28
                });
            }, i * BOSS_CONFIG.attacks.rockDelay); // Используем новую задержку
        }
    }

    // 🔥 ИЗМЕНЕНИЕ: 2 ВИДА ТОРНАДО
    spawnTornado(player) {
        const dir = Math.sign(player.x - this.x) || 1;
        
        // 30% шанс на СИЛЬНОЕ торнадо
        const isStrong = Math.random() < 0.3 || this.phase === 2; 

        this.tornadoes.push({
            x: this.x + (dir * 50),
            y: this.y,
            h: 10, 
            maxH: isStrong ? 450 : 300, 
            w: isStrong ? 120 : 70,
            life: BOSS_CONFIG.attacks.tornadoDuration + (isStrong ? 100 : 0), // Сильное живет дольше
            dir: dir,
            type: isStrong ? 'strong' : 'weak', // Тип торнадо
            opacity: 1.0 // Для плавного исчезновения
        });
    }

    spawnWorms(player, count) {
        for(let i=0; i<count; i++) {
            setTimeout(() => {
                if(!this.isAlive) return;
                this.worms.push({
                    x: player.x + (Math.random() - 0.5) * 200,
                    y: world.getHeight(player.x) + 100,
                    vy: -14,
                    w: 25, h: 50
                });
            }, i * 400); 
        }
    }

    // ========================================================================
    //                                ОБНОВЛЕНИЕ ОБЪЕКТОВ
    // ========================================================================

    updateAttacks(player) {
        // --- 0. ВОЛНЫ (Shockwaves) ---
        for (let i = this.waves.length - 1; i >= 0; i--) {
            let wave = this.waves[i];
            wave.radius += 15; // Быстро расширяется
            wave.width *= 0.9; // Линия становится тоньше
            wave.opacity -= 0.05; // Исчезает
            
            if (wave.opacity <= 0) this.waves.splice(i, 1);
        }

        // --- 1. КАМНИ ---
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            let b = this.blocks[i];
            if (b.state === 'falling') {
                b.vy += BOSS_CONFIG.physics.gravity * 0.5;
                b.y += b.vy;
                b.angle += 0.15;

                if (this.checkRectCollide(b, player)) {
                    player.takeDamage(b.damage);
                    b.state = 'grounded';
                    this.shake = 5;
                }
                const groundY = world.getHeight(b.x);
                if (b.y + b.h/2 >= groundY) {
                    b.y = groundY - b.h/2;
                    b.state = 'grounded';
                    if (this.isOnScreen(player)) this.shake = 2;
                }
            } else if (b.state === 'grounded') {
                b.life--;
                if (this.checkRectCollide(b, player)) {
                    const overlapX = (player.x < b.x) ? -1 : 1;
                    player.x += overlapX * 3; 
                }
                if (b.life <= 0) {
                    b.w *= 0.9; b.h *= 0.9;
                    if (b.w < 2) this.blocks.splice(i, 1);
                }
            }
        }

        // --- 2. ТОРНАДО (ОБНОВЛЕННАЯ ЛОГИКА) ---
        for (let i = this.tornadoes.length - 1; i >= 0; i--) {
            let t = this.tornadoes[i];
            t.life--;
            
            // Плавное исчезновение в конце жизни
            if (t.life < 30) t.opacity = t.life / 30;

            if (t.h < t.maxH) t.h += 10;
            t.y = world.getHeight(t.x);

            // ЛОГИКА ДВИЖЕНИЯ В ЗАВИСИМОСТИ ОТ ТИПА
            if (t.type === 'weak') {
                t.x += t.dir * BOSS_CONFIG.attacks.tornadoSpeed; // Просто едет
            } else {
                // STRONG: Едет медленнее, но тащит сильно
                t.x += t.dir * (BOSS_CONFIG.attacks.tornadoSpeed * 0.5);
                
                // 🔥 ЭФФЕКТ ЗАТЯГИВАНИЯ (Пылесос)
                const distToTornado = t.x - player.x;
                if (Math.abs(distToTornado) < 350) { // Если игрок рядом
                    player.velocityX += distToTornado * 0.02; // Тянем к центру торнадо
                }
            }

            // УРОН ОТ ТОРНАДО
            if (Math.abs(player.x - t.x) < t.w/2 && player.y > t.y - t.h) {
                player.velocityY = -8;
                
                if (t.type === 'strong') {
                     // Мощное торнадо закручивает и кидает
                     player.velocityX = t.dir * 20; // ОЧЕНЬ СИЛЬНО В СТОРОНУ
                     player.takeDamage(2);
                } else {
                     // Слабое просто отталкивает
                     player.velocityX = t.dir * 10;
                     player.takeDamage(1);
                }
            }

            if (t.life <= 0) this.tornadoes.splice(i, 1);
        }

        // --- 3. ЧЕРВИ ---
        for (let i = this.worms.length - 1; i >= 0; i--) {
            let w = this.worms[i];
            w.vy += BOSS_CONFIG.physics.gravity;
            w.y += w.vy;

            if (this.checkRectCollide(w, player)) {
                if (player.velocityY > 0 && player.y < w.y) {
                     player.velocityY = -10; 
                     this.worms.splice(i, 1);
                     continue;
                } else {
                    player.takeDamage(1);
                    player.velocityY = -6;
                }
            }
            if (w.vy > 0 && w.y > world.getHeight(w.x) + 200) {
                this.worms.splice(i, 1);
            }
        }
    }

    checkBodyCollisions(player) {
        const half = this.size / 2;
        
        // Проверяем, находится ли игрок вообще в зоне босса
        const inZone = player.x > this.x - half && player.x < this.x + half &&
                       player.y > this.y - this.size && player.y < this.y + 10;
                       
        if (!inZone) return;

        // 🔥 ИЗМЕНЕНИЕ: Улучшенная проверка прыжка на голову
        // Теперь мы считаем это ударом сверху, если игрок падает и находится в верхней половине босса
        const isTopHit = player.velocityY > 0 && player.y < (this.y - this.size * 0.5);

        if (isTopHit) {
            // ПРЫЖОК НА ГОЛОВУ (Игрок НЕ получает урон)
            player.velocityY = -10; // Отскок
            player.y = this.y - this.size - 5; // Выравниваем, чтобы не застрял
            this.takeDamage(2);
            this.shake = 5;

            // --- СЧЕТЧИК УДАРОВ ---
            this.headHitCount++;
            console.log("Jumps on head:", this.headHitCount);

            // Если прыгнул 3 раза - ВЫЗЫВАЕМ ВОЛНУ
            if (this.headHitCount >= 3) {
                this.headHitCount = 0; // Сброс
                this.triggerShockwave(player); // 🚀 БАМ!
            }

        } else {
            // 🔥 ВАЖНО: Урон наносим ТОЛЬКО если это не был TopHit
            // Контакт сбоку или снизу
            const dir = Math.sign(player.x - this.x) || 1;
            player.velocityX = dir * 12; // Отталкиваем
            player.velocityY = -6;
            player.takeDamage(BOSS_CONFIG.stats.contactDamage);
        }
    }

    takeDamage(amount) {
        if (this.timers.invul > 0) return;
        this.hp -= amount;
        this.timers.invul = 10; 
        this.scaleY = 0.6; this.scaleX = 1.2;
    }

    checkRectCollide(obj, player) {
        return (player.x < obj.x + obj.w/2 &&
                player.x + player.size > obj.x - obj.w/2 &&
                player.y < obj.y + obj.h &&
                player.y + player.size > obj.y);
    }
    
    isOnScreen(player) {
        return Math.abs(this.x - player.x) < 900;
    }

    // ========================================================================
    //                                ВИЗУАЛ
    // ========================================================================

    draw(ctx) {
        if (this.timers.death > 100) return;

        let drawX = this.x;
        let drawY = this.y;

        if (this.shake > 0) {
            drawX += (Math.random() - 0.5) * this.shake;
            drawY += (Math.random() - 0.5) * this.shake;
            this.shake *= 0.9;
        }

        // Рисуем Волны Песка (Shockwaves)
        ctx.save();
        this.waves.forEach(wave => {
            ctx.beginPath();
            ctx.arc(wave.x, wave.y - 20, wave.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(237, 201, 175, ${wave.opacity})`; // Песочный цвет
            ctx.lineWidth = wave.width;
            ctx.stroke();
        });
        ctx.restore();

        // Рисуем Камни
        this.blocks.forEach(b => {
            ctx.save();
            ctx.translate(b.x, b.y + b.h/2);
            ctx.rotate(b.angle || 0);
            ctx.fillStyle = b.damage > 1 ? "#3d2211" : "#654321"; 
            if (b.state === 'grounded' && b.life < 50) ctx.globalAlpha = b.life / 50;
            ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h);
            ctx.restore();
        });

        // Рисуем Торнадо (разные цвета для слабого и сильного)
        this.tornadoes.forEach(t => {
            ctx.save();
            ctx.globalAlpha = t.opacity; // Плавное исчезновение
            
            // Цвет: Сильное - темнее и краснее, Слабое - желтое
            const colorStroke = t.type === 'strong' ? "rgba(100, 50, 0, 0.8)" : "rgba(230, 200, 100, 0.6)";
            const colorFill   = t.type === 'strong' ? "rgba(80, 40, 0, 0.5)"  : "rgba(194, 178, 128, 0.4)";

            ctx.strokeStyle = colorStroke;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(t.x, t.y);
            // Анимация вихря
            for(let i=0; i<t.h; i+=15) {
                 ctx.lineTo(t.x + Math.sin(Date.now()/50 + i)* (i/(t.type==='strong'?1.5:2)), t.y - i);
            }
            ctx.stroke();
            
            ctx.fillStyle = colorFill;
            ctx.beginPath();
            ctx.moveTo(t.x - t.w/2, t.y);
            ctx.lineTo(t.x + t.w/2, t.y);
            ctx.lineTo(t.x + t.w, t.y - t.h);
            ctx.lineTo(t.x - t.w, t.y - t.h);
            ctx.fill();
            
            ctx.restore();
        });

        // Черви
        ctx.fillStyle = "#8B4513";
        this.worms.forEach(w => {
            ctx.fillRect(w.x - w.w/2, w.y, w.w, w.h);
            ctx.fillStyle = "red"; 
            ctx.fillRect(w.x - 6, w.y + 5, 5, 5);
            ctx.fillRect(w.x + 1, w.y + 5, 5, 5);
            ctx.fillStyle = "#8B4513";
        });

        // БОСС
        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.scale(this.scaleX, this.scaleY);

        if (this.state === 'rage' || this.timers.flash > 0 || this.state === 'shockwave') {
             ctx.globalCompositeOperation = "source-atop";
             ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        }
        
        if (this.image.complete) {
            ctx.drawImage(this.image, -this.size/2, -this.size, this.size, this.size);
        } else {
            ctx.fillStyle = "orange";
            ctx.fillRect(-this.size/2, -this.size, this.size, this.size);
        }
        
        if (this.state === 'rage' || this.timers.flash > 0) {
             ctx.globalCompositeOperation = "source-atop";
             ctx.fillStyle = "rgba(255,0,0,0.3)";
             ctx.fillRect(-this.size/2, -this.size, this.size, this.size);
        }

        ctx.restore();

        if (this.state !== 'dying') this.drawHealthBar(ctx, drawX, drawY);
    }

    drawHealthBar(ctx, x, y) {
        const w = 150;
        const h = 10;
        const barY = y - (this.size * this.scaleY) - 50;

        ctx.fillStyle = "black";
        ctx.fillRect(x-w/2-2, barY-2, w+4, h+4);
        
        const pct = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = pct > 0.5 ? "#00FF00" : (pct > 0.2 ? "orange" : "red"); 
        ctx.fillRect(x-w/2, barY, w * pct, h);
    }

    animateDeath() {
        this.timers.death++;
        this.scaleY *= 0.95; 
        this.scaleX *= 1.05; 
        this.y += 3;
        if (Math.random() > 0.5) this.shake = 10;
    }
}