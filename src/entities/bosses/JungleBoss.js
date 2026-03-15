// JungleBoss.js
import { CONFIG } from "../../data/config.js";    // Папка data на уровне src
import { world } from "../../world/World.js";
import { Boss } from "./Boss.js";                 // В той же папке
import { mobManager } from "../mobs/MobManager.js"; 
import { JungleMinion } from "./JungleMinion.js";

const BOSS_CONFIG = {
    hp: 60,
    size: 120,
    gravity: 0.5,
    colors: {
        safe: "#ffffff",
        danger: "#448844",
        charge: "#ffff00",
        shockwave: "#ff4444"
    }
};

export class JungleBoss extends Boss {
    constructor(x) {
        super({ x, y: 0, hp: BOSS_CONFIG.hp });
        
        this.size = BOSS_CONFIG.size;
        this.name = "Jungle Guardian";
        
        this.image = new Image();
        this.image.src = "./assets/images/entities/bosses/jungles.png";

        this.state = 'spawn'; 
        this.phase = 1;
        this.sinkCorrection = 15; 

        this.timers = {
            action: 60,
            death: 0,
            invul: 0,
            trap: 0,
            charge: 0,
            shockwave: 0 
        };

        // Логика боя
        this.attackSequenceIndex = 0; 
        this.jumpCounter = 0; 
        this.stompCounter = 0; 
        this.damageTakenSinceMove = 0;
        
        // Лианы
        this.activeVines = [];
        this.vineState = 'hidden'; 
        this.playerTrapped = false;

        // Частицы
        this.deathParticles = []; 

        // Солнечный шар
        this.solarBall = { active: false, size: 0, charge: 0 };

        // Визуал
        this.scaleX = 1;
        this.scaleY = 1;
        this.tint = BOSS_CONFIG.colors.safe;
        this.facing = 1;
        
        this.velocityX = 0;
        this.velocityY = 0;
    }

    update(player) {
        // 1. Смерть
        if (this.hp <= 0) {
            if (this.state !== 'dying') {
                this.startDeathAnimation(); 
            }
            this.state = 'dying';
            this.isAlive = false;
            this.timers.death++;
            this.updateDeathParticles();
            return;
        }

        // 2. Фазы
        if (this.hp <= this.maxHp * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.triggerPhaseChange();
        }

        // 3. Физика
        this.applyPhysics();
        this.checkPlayerCollision(player);

        // 4. Таймеры
        if (this.timers.invul > 0) this.timers.invul--;
        if (this.timers.action > 0) this.timers.action--;

        // 5. Машина состояний
        switch (this.state) {
            case 'spawn':
                if (this.timers.action <= 0) this.state = 'idle';
                break;

            case 'idle':
                this.tint = BOSS_CONFIG.colors.safe;
                this.facing = Math.sign(player.x - this.x) || 1; 
                // Убрали жесткий сброс scale здесь, чтобы работала плавная анимация внизу
                
                if (this.timers.action <= 0) {
                    this.decideNextAttack(player);
                }
                break;

            case 'attack_vines_telegraph':
                this.tint = BOSS_CONFIG.colors.danger;
                if (this.timers.charge > 0) {
                    this.timers.charge--;
                } else {
                    this.executeVines(player);
                }
                break;

            case 'attack_jumps_trapped': 
                this.handleTrappedJumpLogic(player);
                break;

            case 'attack_summon_jumps': 
                this.handleSummonJumpsLogic(player);
                break;

            case 'attack_solar_charge': 
                this.tint = BOSS_CONFIG.colors.charge;
                this.timers.charge++;
                
                // Здесь мы принудительно меняем форму, это нормально
                this.scaleX = 1 - (this.timers.charge * 0.003);
                this.scaleY = 1 + (this.timers.charge * 0.005);

                this.solarBall.active = true;
                this.solarBall.size = Math.min(120, this.timers.charge / 1.5) + Math.sin(this.timers.charge * 0.5) * 5;
                
                if (this.timers.charge > 150) this.executeSolarStrike(player);
                break;
            
            case 'attack_solar_fire': 
            case 'attack_mass_summon':
                if (this.timers.action <= 0) this.recover();
                break;

            case 'attack_rage_jumps':
                this.handleRageJumps(player);
                break;

            case 'shockwave': 
                this.tint = BOSS_CONFIG.colors.shockwave;
                if (this.timers.action <= 0) this.recover();
                break;
                
            case 'jumping':
                if (this.onGround && this.velocityY >= 0) this.land();
                break;
                
            case 'recovering': 
                // УБРАНО: ручное восстановление scaleX/scaleY отсюда
                // Оно перенесено в конец update(), чтобы работать всегда
                if (this.timers.action <= 0) {
                    this.state = 'idle';
                    this.timers.action = 60; 
                }
                break;
        }

        this.updateVines(player);

        // ==========================================
        // 🔥 ИСПРАВЛЕНИЕ ВИЗУАЛА (Анти-плющилка) 🔥
        // ==========================================
        // Если босс не в фазе зарядки шара (где он должен деформироваться)
        // Мы плавно возвращаем его к нормальному размеру (1, 1).
        // Это работает как пружина после прыжков, приземлений или получения урона.
        if (this.state !== 'attack_solar_charge') {
            this.scaleX += (1 - this.scaleX) * 0.1;
            this.scaleY += (1 - this.scaleY) * 0.1;
        }
    }


    // ================= ЛОГИКА АТАК =================

    decideNextAttack(player) {
        if (this.phase === 1) {
            if (this.attackSequenceIndex === 0) {
                this.startVinesAttack(player);
            } 
            else if (this.attackSequenceIndex === 1) {
                if (this.playerTrapped) {
                    this.state = 'attack_jumps_trapped';
                    this.jumpCounter = 0;
                } else {
                    this.attackSequenceIndex++;
                    this.decideNextAttack(player); 
                }
            } 
            else if (this.attackSequenceIndex === 2) {
                this.state = 'attack_summon_jumps';
                this.jumpCounter = 0;
                this.attackSequenceIndex = 0; 
            }
        } else {
            const rand = Math.random();
            if (this.hp < this.maxHp * 0.2) {
                this.startRageJumps();
            } else if (rand < 0.4) {
                this.startSolarAttack();
            } else {
                this.startMassSummon();
            }
        }
    }

    // --- ЛИАНЫ ---
    startVinesAttack(player) {
        this.state = 'attack_vines_telegraph';
        this.timers.charge = 60; 
        this.activeVines = [];
        
        for (let i = -6; i <= 6; i++) {
            const offsetX = i * 20 + (Math.random() * 10 - 5);
            const vineX = player.x + offsetX;
            const vineGroundY = world.getHeight(vineX);

            this.activeVines.push({
                x: vineX,
                y: vineGroundY + 40,
                h: 0,
                maxH: 130 + Math.random() * 50,
                width: 18 + Math.random() * 8,
                delay: Math.random() * 15,
                solid: false 
            });
        }
        this.vineState = 'warning';
    }

    executeVines(player) {
        this.vineState = 'active';
        
        const centerVine = this.activeVines[Math.floor(this.activeVines.length / 2)];
        const distY = Math.abs((player.y + player.size) - (centerVine.y - 40)); 

        if (distY < 60 && Math.abs(player.x - centerVine.x) < 150) { 
            this.playerTrapped = true;
            this.timers.trap = 180;
        } else {
            this.playerTrapped = false;
        }

        this.attackSequenceIndex = 1;
        this.state = 'idle';
        this.timers.action = 20;
    }

    updateVines(player) {
        if (this.vineState === 'active') {
            this.activeVines.forEach(v => {
                if (this.timers.action > 0) return;
                if (v.h < v.maxH) v.h += 12; 
                else v.solid = true;

                if (v.solid && !this.playerTrapped) {
                     if (player.x + player.size > v.x && player.x < v.x + v.width &&
                         player.y + player.size > v.y - v.h) {
                        const centerX = v.x + v.width / 2;
                        const playerCenterX = player.x + player.size / 2;
                        if (playerCenterX < centerX) player.x = v.x - player.size;
                        else player.x = v.x + v.width;
                        player.velocityX = 0;
                     }
                }
            });

            if (this.playerTrapped) {
                this.timers.trap--;
                player.velocityX = 0;
                player.velocityY = 0;
                const centerVine = this.activeVines[Math.floor(this.activeVines.length / 2)];
                const targetX = centerVine.x - player.size / 2;
                const targetY = centerVine.y - player.size - 20;
                player.x += (targetX - player.x) * 0.2;
                player.y += (targetY - player.y) * 0.2;

                if (this.timers.trap <= 0) {
                    this.playerTrapped = false;
                    this.vineState = 'fading';
                }
            } else {
                if (this.activeVines[0].h >= 50) {
                      setTimeout(() => { if(this.vineState === 'active') this.vineState = 'fading' }, 2000); 
                }
            }
        } else if (this.vineState === 'fading') {
            let stillActive = false;
            this.activeVines.forEach(v => {
                v.h *= 0.85; 
                if (v.h > 1) stillActive = true;
            });
            if (!stillActive) this.vineState = 'hidden';
        }
    }

    // --- УДАРНАЯ ВОЛНА ---
    triggerShockwave(player) {
        this.state = 'shockwave';
        this.timers.action = 40; 
        this.stompCounter = 0; 
        this.timers.invul = 20;
        const dir = Math.sign(player.x - this.x) || 1;
        player.velocityX = dir * 25; 
        player.velocityY = -15;      
        player.takeDamage(2);        
        this.scaleX = 1.4;
        this.scaleY = 0.6;
    }

    // --- СОЛНЕЧНЫЙ УДАР ---
    startSolarAttack() {
        this.state = 'attack_solar_charge';
        this.timers.charge = 0;
        this.solarBall.active = true;
        this.velocityX = 0;
    }

    executeSolarStrike(player) {
        this.state = 'attack_solar_fire';
        this.solarBall.active = false;
        
        // Сброс формы (хотя update это и так сделает теперь)
        this.scaleX = 1;
        this.scaleY = 1;

        const dx = player.x - (this.x + this.size/2);
        const dy = player.y - (this.y + this.size/2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        const maxRadius = 400; 

        if (dist < maxRadius) {
            const damageFactor = 1 - (dist / maxRadius);
            const maxDamage = 20; 
            const damage = Math.ceil(maxDamage * damageFactor);

            player.takeDamage(damage);
            player.velocityX = Math.sign(dx) * (20 * damageFactor);
            player.velocityY = -10 * damageFactor;
        }
        
        this.timers.action = 60;
    }

    startMassSummon() {
        this.state = 'attack_mass_summon';
        this.tint = BOSS_CONFIG.colors.danger;
        for(let i=0; i<10; i++) {
            setTimeout(() => {
                if(!this.isAlive) return;
                this.spawnMinion(this.x + (Math.random()-0.5)*600, this.y - 200);
            }, i * 100);
        }
        this.timers.action = 120;
    }
    
    handleTrappedJumpLogic(player) {
        if (this.onGround) {
            if (this.jumpCounter >= 3) {
                this.jumpCounter = 0; 
                this.attackSequenceIndex = 2; 
                this.recover();
                return;
            }
            this.jumpCounter++;
            this.scaleY = 0.6; // Сплющиваем для прыжка (автоматически восстановится в полете)
            this.velocityY = -15;
            const dx = player.x - this.x;
            this.velocityX = dx / 30;
            this.state = 'jumping';
        }
    }

    handleSummonJumpsLogic(player) {
        if (this.onGround) {
            if (this.jumpCounter >= 5) {
                this.recover();
                return;
            }
            this.jumpCounter++;
            this.scaleY = 0.8; 
            this.velocityY = -10;
            this.velocityX = 0;
            this.state = 'jumping';
            this.spawnMinion(this.x + (Math.random()-0.5)*100, this.y - 50);
        }
    }

    startRageJumps() {
        this.state = 'attack_rage_jumps';
        this.jumpCounter = 0;
    }

    handleRageJumps(player) {
        if (this.onGround) {
            this.scaleY = 0.5;
            this.velocityY = -22;
            const dir = Math.sign(player.x - this.x) || 1;
            this.velocityX = dir * 8;
            this.state = 'jumping';
        }
    }

    spawnMinion(x, y) {
        const minion = new JungleMinion(x, y, this.phase === 2);
        mobManager.mobs.push(minion);
    }

    applyPhysics() {
        this.velocityY += BOSS_CONFIG.gravity;
        this.y += this.velocityY;
        this.x += this.velocityX;
        
        if (this.onGround) {
            this.velocityX *= 0.8;
        }

        const groundY = world.getHeight(this.x);
        
        if (this.y + this.size >= groundY + this.sinkCorrection) {
            this.y = groundY + this.sinkCorrection - this.size;
            this.velocityY = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
    }

    land() {
        // Эффект приземления (сплющивание)
        this.scaleY = 0.7;
        this.scaleX = 1.3;
        
        this.velocityX = 0;

        // Важно: благодаря коду в конце update(), 
        // эти 0.7 превратятся обратно в 1.0 за несколько кадров.

        if (this.state === 'jumping') {
            if (this.attackSequenceIndex === 1) {
                this.state = 'attack_jumps_trapped';
            } else if (this.attackSequenceIndex === 2 || this.attackSequenceIndex === 0) {
                this.state = 'attack_summon_jumps';
            } else if (this.phase === 2) {
                this.recover();
            }
        }
        if (this.state === 'attack_rage_jumps') {
            this.recover(); 
        }
    }

    recover() {
        this.state = 'recovering';
        this.timers.action = 90;
        this.solarBall.active = false;
        this.tint = BOSS_CONFIG.colors.safe;
    }

    triggerPhaseChange() {
        this.timers.invul = 60;
        this.scaleX = 1.5;
        this.scaleY = 0.5;
        mobManager.spawnUraniumParticle(this.x, this.y);
        this.stompCounter = 0; 
    }

    checkPlayerCollision(player) {
        if (player.x + player.size > this.x && player.x < this.x + this.size &&
            player.y + player.size > this.y && player.y < this.y + this.size) {
            
            const feetY = player.y + player.size;
            const headZoneY = this.y + 40; 
            
            const isTopAttack = player.velocityY > 0 && feetY < headZoneY;

            if (isTopAttack) {
                player.velocityY = -12; 
                player.onGround = false;
                this.takeDamage(2, player); 
                this.scaleY = 0.8;

                this.stompCounter++;
                if (this.stompCounter >= 5) {
                    this.triggerShockwave(player);
                }

            } else {
                const pushDir = Math.sign(player.x - (this.x + this.size/2)) || 1;
                player.velocityX = pushDir * 12;
                player.velocityY = -6;
                player.takeDamage(1); 
            }
        }
    }

    takeDamage(amount, playerReference) {
        if (this.timers.invul > 0) return;
        this.hp -= amount;
        this.timers.invul = 5; 
        this.scaleX = 1.1;
        this.scaleY = 0.9;

        this.damageTakenSinceMove += amount;
        
        if (this.damageTakenSinceMove >= 5 && this.onGround && this.state !== 'dying') {
            this.repositionBoss(playerReference || world.player); 
        }
    }

    repositionBoss(player) {
        this.damageTakenSinceMove = 0;
        this.state = 'jumping';
        this.timers.action = 30; 
        
        this.velocityY = -18;
        this.scaleY = 0.6; // Подготовка к прыжку
        
        if (player) {
            const jumpDir = (player.x < this.x) ? 1 : -1; 
            this.velocityX = jumpDir * 12;
        } else {
            this.velocityX = (Math.random() - 0.5) * 20;
        }
        
        if (this.state === 'attack_solar_charge') {
             this.solarBall.active = false;
             // Сброс не обязателен, update поправит
        }
    }

    // ================= СМЕРТЬ И ОТРИСОВКА =================
    
    startDeathAnimation() {
        for (let i = 0; i < 50; i++) {
            this.deathParticles.push({
                x: this.x + Math.random() * this.size,
                y: this.y + Math.random() * this.size,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 1) * 15,
                size: Math.random() * 15 + 5,
                color: Math.random() > 0.5 ? "#448844" : "#224422", 
                life: 1.0
            });
        }
    }

    updateDeathParticles() {
        this.deathParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5; 
            p.life -= 0.02;
            p.size *= 0.95;
        });
    }

    draw(ctx) {
        if (this.state === 'dying') {
            this.deathParticles.forEach(p => {
                if (p.life > 0) {
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.life;
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                }
            });
            ctx.globalAlpha = 1;
            return; 
        }

        const drawX = this.x;
        const drawY = this.y;

        // 1. Лианы
        if (this.vineState !== 'hidden') {
            this.activeVines.forEach(v => {
                const vineBottom = v.y; 
                const vineHeight = v.h;
                
                if (this.vineState === 'warning') {
                    ctx.fillStyle = "rgba(255, 50, 50, 0.3)"; 
                    ctx.beginPath();
                    ctx.arc(v.x + v.width/2, vineBottom - 20, 20, 0, Math.PI*2); 
                    ctx.fill();
                }
                
                if (vineHeight > 0) {
                    ctx.fillStyle = "#2e8b57"; 
                    ctx.beginPath();
                    ctx.moveTo(v.x, vineBottom);
                    ctx.lineTo(v.x, vineBottom - vineHeight);
                    ctx.lineTo(v.x + v.width, vineBottom - vineHeight);
                    ctx.lineTo(v.x + v.width, vineBottom);
                    ctx.fill();
                    
                    ctx.fillStyle = "#225522";
                    ctx.fillRect(v.x + 2, vineBottom - vineHeight * 0.8, v.width - 4, vineHeight * 0.2);
                    ctx.fillRect(v.x - 5, vineBottom - vineHeight * 0.5, 5, 10); 
                    ctx.fillRect(v.x + v.width, vineBottom - vineHeight * 0.3, 5, 10); 
                }
            });
        }

        // 2. Солнечный Шар
        if (this.solarBall.active) {
            const ballX = drawX + this.size/2;
            const ballY = drawY - 50 - (this.scaleY * 20); 

            ctx.save();
            ctx.shadowBlur = 40;
            ctx.shadowColor = "yellow";
            ctx.fillStyle = `rgba(255, 255, 0, ${Math.random() * 0.2 + 0.8})`;
            
            ctx.beginPath();
            ctx.arc(ballX, ballY, this.solarBall.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Молнии
            ctx.save();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < 4; i++) { 
                let lx = ballX;
                let ly = ballY;
                ctx.moveTo(lx, ly);
                for (let j = 0; j < 5; j++) {
                    lx += (Math.random() - 0.5) * (this.solarBall.size * 2);
                    ly += (Math.random() - 0.5) * (this.solarBall.size * 2);
                    ctx.lineTo(lx, ly);
                }
            }
            ctx.stroke();
            ctx.restore();
        }

        // 3. БОСС
        ctx.save();
        
        // --- ОТРИСОВКА С УЧЕТОМ DEFORMATION ---
        // Точка трансформации: Низ-Центр
        const centerX = this.size/2;
        const bottomY = this.size;
        
        ctx.translate(drawX + centerX, drawY + bottomY); 
        ctx.scale(this.scaleX, this.scaleY); 
        ctx.scale(this.facing, 1); 

        if (this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, -this.size/2, -this.size, this.size, this.size);
        } else {
            ctx.fillStyle = "orange";
            ctx.fillRect(-this.size/2, -this.size, this.size, this.size);
        }
        
        // Эффекты наложения (Overlay)
        if (this.state === 'shockwave') {
             ctx.globalCompositeOperation = "source-atop";
             ctx.fillStyle = "rgba(255, 50, 50, 0.7)"; 
             ctx.fillRect(-this.size/2, -this.size, this.size, this.size);
        }
        else if (this.state === 'attack_solar_charge') {
             ctx.globalCompositeOperation = "source-atop";
             ctx.fillStyle = `rgba(255, 255, 0, ${Math.random() * 0.4})`; 
             ctx.fillRect(-this.size/2, -this.size, this.size, this.size);
        }
        else if (this.timers.invul > 0) {
             ctx.globalCompositeOperation = "source-atop";
             ctx.fillStyle = "rgba(255,255,255,0.5)";
             ctx.fillRect(-this.size/2, -this.size, this.size, this.size);
        }

        ctx.restore();

        // 4. HP Bar
        if (this.state !== 'dying') this.drawHealthBar(ctx, drawX + this.size/2, drawY);
    }

    drawHealthBar(ctx, x, y) {
        const w = 150;
        const h = 10;
        const barY = y - 50; 

        ctx.fillStyle = "black";
        ctx.fillRect(x-w/2-2, barY-2, w+4, h+4);
        
        const pct = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = pct > 0.5 ? "#00FF00" : (pct > 0.2 ? "orange" : "red"); 
        ctx.fillRect(x-w/2, barY, w * pct, h);
    }
}