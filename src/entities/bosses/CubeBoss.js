// src/entities/bosses/CubeBoss.js
import { CONFIG } from "../../data/config.js"; // data, а не core
import { world } from "../../world/World.js";
import { Boss } from "./Boss.js"; // Он в той же папке

export class CubeBoss extends Boss {
    constructor(x) {
        super({ x, y: 0, hp: 40 }); 

        // ==========================================
        // НАСТРОЙКИ (МОЖНО МЕНЯТЬ)
        // ==========================================
        this.size = 120;       
        this.baseColor = "#5a5a60"; 
        
        // Настройки бровей
        this.browThickness = 20; // Толщина бровей
        this.browOffset = 1;    // Насколько низко они нависают на глаза
        
        // Логика боя
        this.maxJumpsBeforeTired = 6; 

        // ==========================================
        // ВНУТРЕННИЕ ПЕРЕМЕННЫЕ (ЛУЧШЕ НЕ ТРОГАТЬ)
        // ==========================================
        this.velocityX = 0;
        this.velocityY = 0;
        this.gravity = CONFIG.gravity;
        this.groundCorrection = 40; 
        this.state = 'idle'; 
        this.jumpsDone = 0;
        
        this.timers = { charge: 0, tired: 0, invul: 0, death: 0 };

        // Анимация
        this.scaleX = 1;
        this.scaleY = 1;
        this.particles = [];
        this.decor = this.generateDecor();
    }

    // ========================================================================
    //                              1. ЛОГИКА (LOGIC)
    //              Физика, удары, перемещение, искусственный интеллект
    // ========================================================================

    update(player) {
        this.updateParticles();

        // Смерть
        if (this.hp <= 0 && this.state !== 'dying') {
            this.state = 'dying';
            this.isAlive = false; 
        }
        if (this.state === 'dying') {
            this.animateDeath(); // Это в визуале, но вызывается логикой
            return;
        }

        // Физика
        this.applyPhysics();
        this.checkGroundCollision(player); // Тут же вызывается land()

        // Коллизия с игроком (урон)
        this.checkPlayerCollision(player);

        // Плавное возвращение формы (желе-эффект)
        this.scaleX += (1 - this.scaleX) * 0.1;
        this.scaleY += (1 - this.scaleY) * 0.1;

        if (this.timers.invul > 0) this.timers.invul--;

        // Машина состояний (AI)
        switch (this.state) {
            case 'idle': this.handleIdle(player); break;
            case 'charge': this.handleCharge(player); break;
            case 'tired': this.handleTired(); break;
        }
    }

    applyPhysics() {
        if (this.velocityY < 15) this.velocityY += this.gravity;
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityX *= 0.98; // Трение
    }

    checkGroundCollision(player) {
        const groundY = world.getHeight(this.x) + this.groundCorrection; 
        
        if (this.y >= groundY) {
            if (this.velocityY > 0) {
                if (!this.onGround) this.land(player);
                this.y = groundY;
                this.velocityY = 0;
                this.onGround = true;
                this.velocityX *= 0.5; 
            } else {
                 this.y = groundY;
            }
        } else {
            this.onGround = false;
        }

        if (this.y > groundY + 10) { this.y = groundY; this.velocityY = 0; }
    }

    checkPlayerCollision(player) {
        const halfSize = this.size / 2;
        if (player.x + player.size > this.x - halfSize &&
            player.x < this.x + halfSize &&
            player.y + player.size > this.y - this.size &&
            player.y < this.y) {

            // Игрок прыгнул сверху
            const isJumpingOnTop = player.velocityY > 0 && (player.y + player.size < this.y - this.size * 0.3);

            if (isJumpingOnTop) {
                player.velocityY = -10;
                player.onGround = false;
                this.takeDamage();
                this.createParticles(8);
                // Сплющивание при ударе
                this.scaleY = 0.7; this.scaleX = 1.3;
            } 
            else {
                // Игрок коснулся сбоку
                if (this.state !== 'tired' && this.state !== 'dying') {
                    const dir = Math.sign(player.x - this.x) || 1;
                    player.velocityX = dir * 12;
                    player.velocityY = -5;
                    player.takeDamage(1);
                }
            }
        }
    }

    handleIdle(player) {
        if (this.onGround) {
            if (this.jumpsDone >= this.maxJumpsBeforeTired) {
                this.state = 'tired';
                this.timers.tired = 250;
                return;
            }
            this.state = 'charge';
            this.timers.charge = 30; // Увеличил таймер, чтобы видно было подготовку (было 3 - слишком быстро)
            const dist = Math.abs(player.x - this.x);
            this.nextJumpType = dist > 400 ? 'big' : 'small';
        }
    }

    handleCharge(player) {
        this.timers.charge--;
        // Дрожание перед прыжком (логика влияет на визуал)
        this.scaleY = 0.9 + Math.random()*0.05;
        this.scaleX = 1.1 - Math.random()*0.05;

        if (this.timers.charge <= 0) {
            this.jump(player);
        }
    }

    handleTired() {
        this.timers.tired--;
        // Дыхание задается в drawFace, тут только логика таймера
        if (this.timers.tired <= 0) {
            this.state = 'idle';
            this.jumpsDone = 0;
            this.scaleX = 1;
            this.scaleY = 1;
        }
    }

    jump(player) {
        this.state = 'jump';
        this.jumpsDone++;
        this.onGround = false;
        const dx = player.x - this.x;
        let speedX = dx / 10; 

        if (this.nextJumpType === 'big') {
            this.velocityY = -22; 
            if (speedX > 10) speedX = 10;
            if (speedX < -10) speedX = -10;
        } else {
            this.velocityY = -14;
            if (speedX > 6) speedX = 6;
            if (speedX < -6) speedX = -6;
        }
        this.velocityX = speedX;
    }

    land(player) {
        this.scaleY = 0.7;
        this.scaleX = 1.3;
        this.createParticles(10);
        if (this.nextJumpType === 'big') {
            const dist = Math.abs(player.x - this.x);
            if (dist < 200 && player.onGround) player.velocityY = -4;
        }
        this.state = 'idle';
    }

    takeDamage() {
        if (this.timers.invul > 0) return;
        this.hp--;
        this.timers.invul = 15;
    }

    // ========================================================================
    //                              2. ВИЗУАЛ (VISUALS)
    //               Отрисовка, цвета, декорации, лицо, частицы
    // ========================================================================

    draw(ctx) {
        // 1. Частицы (пыль)
        ctx.fillStyle = "#333";
        this.particles.forEach(p => ctx.fillRect(p.x, p.y, p.size, p.size));

        if (this.timers.death > 100) return;

        ctx.save();
        
        // 2. Полоска HP (не рисуем, если умирает)
        if (this.state !== 'dying') this.drawHealthBar(ctx);

        // 3. Трансформация тела (позиция + scale)
        ctx.translate(this.x, this.y);
        ctx.scale(this.scaleX, this.scaleY);

        const s = this.size;
        
        // 4. Определение цвета
        let color = this.baseColor;
        if (this.timers.invul > 0 && Math.floor(Date.now()/50)%2===0) color = "white"; // Мигание
        else if (this.state === 'tired') color = "#4a4a50"; // Чуть темнее, когда устал

        // 5. Рисуем ТЕЛО (Куб)
        ctx.fillStyle = color;
        ctx.beginPath();
        // Рисуем от низа (0,0) вверх
        ctx.roundRect(-s/2, -s, s, s, 10);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#222";
        ctx.stroke();

        // 6. Рисуем ДЕКОР (мох/пятна)
        this.drawDecor(ctx, s);

        // 7. Рисуем ЛИЦО (Глаза, брови, рот)
        this.drawFace(ctx, s);

        ctx.restore();
    }

    drawFace(ctx, s) {
        const eyeY = -s * 0.6; // Высота глаз
        const offset = 25;     // Расстояние между глазами
        
        // --- ГЛАЗА ---
        // Когда устал - глаза "тусклые"
        ctx.fillStyle = this.state === 'tired' ? "#ccc" : "#fff";
        
        // Рисуем белки глаз
        ctx.beginPath(); ctx.ellipse(-offset, eyeY, 12, 14, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(offset, eyeY, 12, 14, 0, 0, Math.PI*2); ctx.fill();

        // --- ЗРАЧКИ ---
        // Рисуем только если не устал (или можно оставить маленькие точки)
        if (this.state !== 'tired') {
            ctx.fillStyle = "black";
            // Зрачки смотрят по направлению движения
            const look = Math.sign(this.velocityX) * 2;
            ctx.beginPath(); ctx.arc(-offset + look, eyeY, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(offset + look, eyeY, 4, 0, Math.PI*2); ctx.fill();
        }

        // --- БРОВИ (НОВОЕ!) ---
        ctx.fillStyle = "#1a1a1a"; // Почти черный цвет бровей
        const browY = eyeY - this.browThickness + this.browOffset; 
        
        // Левая бровь (прямоугольник)
        ctx.fillRect(-offset - 20, browY, 40, this.browThickness);
        // Правая бровь (прямоугольник)
        ctx.fillRect(offset - 20, browY, 40, this.browThickness);

        // --- РОТ (ТОЛЬКО КОГДА УСТАЛ) ---
        if (this.state === 'tired') {
            ctx.fillStyle = "#111"; // Темный рот
            
            // Анимация дыхания (синус от времени)
            const breath = Math.sin(Date.now() / 150) * 4; 
            
            const mouthY = -s * 0.3; // Чуть ниже глаз
            
            ctx.beginPath();
            // Рисуем овал (рот), ширина и высота меняются от дыхания
            ctx.ellipse(0, mouthY, 8 + breath/2, 6 + breath, 0, 0, Math.PI*2);
            ctx.fill();
        }
    }

    drawDecor(ctx, s) {
        this.decor.forEach(d => {
            if (d.type === 'moss') {
                ctx.fillStyle = d.color;
                ctx.beginPath(); ctx.arc(d.x, -s/2+d.y, d.r, 0, Math.PI*2); ctx.fill();
            }
        });
    }

    generateDecor() {
        const d = [];
        for (let i = 0; i < 8; i++) {
            d.push({
                type: 'moss', 
                x: (Math.random()-0.5)*this.size*0.8, 
                y: (Math.random()-0.5)*this.size*0.8,
                r: 5+Math.random()*8, 
                color: Math.random()>0.5?"#4a6b36":"#365225"
            });
        }
        return d;
    }

    drawHealthBar(ctx) {
        const w = 100;
        const h = 8;
        const x = this.x - w/2;
        const y = this.y - this.size - 40;
        
        ctx.fillStyle = "black";
        ctx.fillRect(x-2, y-2, w+4, h+4);
        
        const pct = Math.max(0, this.hp / 40);
        ctx.fillStyle = "red";
        ctx.fillRect(x, y, w * pct, h);
    }

    // --- СИСТЕМА ЧАСТИЦ (ДЛЯ ЭФФЕКТОВ) ---
    createParticles(n) {
        for(let i=0; i<n; i++) {
            this.particles.push({
                x: this.x + (Math.random()-0.5)*this.size,
                y: this.y,
                vx: (Math.random()-0.5)*10,
                vy: -Math.random()*10,
                life: 30, size: Math.random()*5+2
            });
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.5; p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }
    
    animateDeath() {
        this.timers.death++;
        this.scaleY -= 0.02;
        this.scaleX += 0.02;
        this.y += 2;
    }
}