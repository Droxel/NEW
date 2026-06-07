// src/world/objects/BossDecorations.js

export class BossTorch {
    constructor(data) {
        this.type = "boss_torch";
        this.x = Number(data.x) || 0;
        this.y = Number(data.y) || 0;
        this.width = 30;
        this.height = 60;
        
        this.intensity = 0;
        this.timer = 0;
        this.delay = Number(data.delay) || 0;
        this.triggered = false;
    }

    // Геттер для системы освещения
get light() {
    return {
        x: this.x + this.width / 2,
        y: this.y + 10,
        // Даже если интенсивность 0, даем крошечный радиус или ставим минимум 0.2
        radius: 150 * Math.max(0.1, this.intensity), 
        intensity: Math.max(0.1, this.intensity),
        isTorch: true
    };
}
    update(dt, player) {
        if (!player) return;
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        if (distToPlayer < 800) this.triggered = true;

        if (this.triggered) {
            const deltaMs = dt < 1 ? dt * 1000 : dt;
            this.timer += deltaMs;
            if (this.timer >= this.delay) {
                this.intensity = Math.min(1, this.intensity + (deltaMs * 0.005));
            }
        }
    }

draw(ctx, camera = { x: 0, y: 0 }) {
    // 1. Проверяем, что камера — это объект и у неё есть числа
    const camX = (camera && typeof camera.x === 'number') ? camera.x : 0;
    const camY = (camera && typeof camera.y === 'number') ? camera.y : 0;

    const screenX = this.x - camX;
    const screenY = this.y - camY;

    // 2. ФИНАЛЬНАЯ ПРОВЕРКА: если координаты всё равно битые, не рисуем
    if (!Number.isFinite(screenX) || !Number.isFinite(screenY)) return;

        // 1. Рисуем держатель факела (Minimalist SVG style)
        ctx.fillStyle = "#2c2c2c";
        // Основание на стене
        ctx.fillRect(screenX + 10, screenY + 20, 10, 25);
        // Наклонная палка
        ctx.beginPath();
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 4;
        ctx.moveTo(screenX + 15, screenY + 40);
        ctx.lineTo(screenX + 15, screenY + 15);
        ctx.stroke();

        if (this.intensity > 0.01) {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            
            // Анимация пламени
            const flicker = Math.sin(Date.now() * 0.008) * 5;
            const pulse = Math.cos(Date.now() * 0.012) * 2;
            
            const cx = screenX + 15;
            const cy = screenY + 10;

            // Голубое свечение (ядро)
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20 + flicker);
            grad.addColorStop(0, `rgba(100, 200, 255, ${this.intensity})`);
            grad.addColorStop(0.4, `rgba(0, 100, 255, ${this.intensity * 0.6})`);
            grad.addColorStop(1, "rgba(0, 0, 50, 0)");
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            // Рисуем форму капли для пламени
            ctx.moveTo(cx, cy + 10);
            ctx.quadraticCurveTo(cx + 15 + pulse, cy, cx, cy - 20 - flicker);
            ctx.quadraticCurveTo(cx - 15 - pulse, cy, cx, cy + 10);
            ctx.fill();
            
            ctx.restore();
        }
    }
}

export class BossPillar {
    constructor(data) {
        this.type = "boss_pillar";
        this.x = Number(data.x) || 0;
        this.y = Number(data.y) || 0;
        this.width = 60;
        this.height = 300; // Вернул стандартную высоту
        this.intensity = 0;
        this.particles = [];
    }

    get light() {
        return {
            x: this.x + this.width / 2,
            y: this.y,
            radius: 400 * Math.max(0.1, this.intensity),
            intensity: Math.max(0.1, this.intensity),
            isTorch: true
        };
    }

    update(dt, player) {
        if (!player) return;
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        const target = distToPlayer < 1100 ? 1 : 0;
        
        const deltaMs = dt < 1 ? dt * 1000 : dt;
        this.intensity += (target - this.intensity) * (deltaMs * 0.002);

        // Искры
        if (this.intensity > 0.3 && Math.random() < 0.1) {
            this.particles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * 40,
                y: this.y,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -Math.random() * 2 - 1,
                life: 1.0,
                size: Math.random() * 2 + 1
            });
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= 0.02;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx, camera = { x: 0, y: 0 }) {
        const camX = camera.x || 0;
        const camY = camera.y || 0;
        const screenX = this.x - camX;
        const screenY = this.y - camY;

        // 1. Рисуем тело колонны
        const stoneGrad = ctx.createLinearGradient(screenX, screenY, screenX + this.width, screenY);
        stoneGrad.addColorStop(0, "#1a1a1a");
        stoneGrad.addColorStop(0.5, "#333");
        stoneGrad.addColorStop(1, "#1a1a1a");
        ctx.fillStyle = stoneGrad;
        ctx.fillRect(screenX, screenY, this.width, this.height);

        // Рисуем насечки на камне
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 2;
        for(let i = 50; i < this.height; i += 50) {
            ctx.beginPath();
            ctx.moveTo(screenX, screenY + i);
            ctx.lineTo(screenX + this.width, screenY + i);
            ctx.stroke();
        }

        // 2. Чаша
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.moveTo(screenX - 10, screenY);
        ctx.lineTo(screenX + this.width + 10, screenY);
        ctx.lineTo(screenX + this.width, screenY + 20);
        ctx.lineTo(screenX, screenY + 20);
        ctx.closePath();
        ctx.fill();

        // 3. Яркое пламя и частицы
        if (this.intensity > 0.01) {
            const cx = screenX + this.width / 2;
            const cy = screenY - 5;
            const time = Date.now();

            ctx.save();
            ctx.globalCompositeOperation = "lighter";

            // Отрисовка искр
            this.particles.forEach(p => {
                ctx.fillStyle = `rgba(0, 255, 255, ${p.life})`;
                ctx.beginPath();
                ctx.arc(p.x - camX, p.y - camY, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // Слои огня
            const flicker = Math.sin(time * 0.008) * 5;
            
            // Аура
            const grad2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 + flicker);
            grad2.addColorStop(0, `rgba(0, 100, 255, ${this.intensity * 0.5})`);
            grad2.addColorStop(1, "transparent");
            ctx.fillStyle = grad2;
            ctx.fillRect(cx - 100, cy - 100, 200, 200);

            // Центр пламени
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30 + flicker);
            grad.addColorStop(0, `rgba(255, 255, 255, ${this.intensity})`);
            grad.addColorStop(0.5, `rgba(0, 255, 255, ${this.intensity})`);
            grad.addColorStop(1, "transparent");
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(cx, cy - 10, 25 + flicker/2, 40 + flicker, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }
}