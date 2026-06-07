// src/entities/bosses/skeleton/SkeletonRenderer.js

// --- 1. КЭШИРОВАНИЕ СВЕЧЕНИЯ (OFFSCREEN CANVAS) ---
const glowCache = new Map();
let projectileCache = null;

function getGlowCanvas(radius) {
    const size = Math.ceil(radius * 2);
    if (glowCache.has(size)) return glowCache.get(size);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    grad.addColorStop(0, 'rgba(0, 204, 255, 0.15)');
    grad.addColorStop(1, 'rgba(0, 204, 255, 0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, Math.PI * 2);
    ctx.fill();

    glowCache.set(size, canvas);
    return canvas;
}
function getProjectileCanvas() {
    if (projectileCache) return projectileCache;

    const size = 60; // Размер с учетом тени (18 радиус + запас на размытие)
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const center = size / 2;

    // Настраиваем свечение один раз здесь
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ccff';
    
    // Внешний белый круг
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(center, center, 18, 0, Math.PI * 2);
    ctx.fill();

    // Внутренний голубой круг
    ctx.shadowBlur = 0; // Для внутреннего круга тень не нужна
    ctx.fillStyle = '#00ccff';
    ctx.beginPath();
    ctx.arc(center, center, 10, 0, Math.PI * 2);
    ctx.fill();

    projectileCache = canvas;
    return canvas;
}

const PI2 = Math.PI * 2; // Предрасчет для циклов

export function getLights(boss) {
    const lights = [];
    const cx = boss.x + boss.width / 2;
    const cy = boss.y + boss.height / 2;
    
    if (boss.isAlive && boss.state !== 'dying') {
        lights.push({ x: cx, y: cy, radius: 350, intensity: 0.7, color: '#00ccff' });
    }

    // Замена forEach на for для скорости
    for (let i = 0; i < boss.hands.length; i++) {
        const hand = boss.hands[i];
        if (hand.width > 0) {
            lights.push({
                x: hand.x + hand.width / 2,
                y: hand.y + hand.height / 2,
                radius: 180,
                intensity: 0.6,
                color: '#00ccff'
            });
        }
    }

    if (boss.state === 'waking' && boss.stateTimer > 200 && boss.stateTimer < 800) {
        const intensity = Math.min(1.5, (boss.stateTimer - 200) * 0.01); 
        lights.push({ x: cx, y: cy, radius: 1000, intensity: intensity, color: '#00ccff' });
    }
    
if (boss.state === 'dying') {
        const portalY = boss.portalY || cy - 180;
        const t = boss.timers.death;
        // Свет плавно разгорается и гаснет
        let portalGlow = 0;
        if (t > 150 && t < 350) portalGlow = t < 200 ? (t-150)*0.04 : (350-t)*0.04;
        if (portalGlow > 0) lights.push({ x: cx, y: portalY, radius: 900, intensity: portalGlow, color: '#00ccff' });
    }
    
    for (let i = 0; i < boss.projectiles.length; i++) {
        const p = boss.projectiles[i];
        lights.push({ x: p.x, y: p.y, radius: 250, intensity: 1.0, color: '#00ccff' });
    }

    return lights;
}

function drawBackGlow(ctx, x, y, width, height) {
    const radius = Math.max(width, height) * 1.2;
    const glowImg = getGlowCanvas(radius);
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    ctx.globalCompositeOperation = 'lighter';
    // Отрисовка закэшированной картинки в разы быстрее градиента
    ctx.drawImage(glowImg, centerX - radius, centerY - radius);
    ctx.globalCompositeOperation = 'source-over';
}

export function drawBoss(boss, ctx, assets) {
    if (!boss.isAlive) return;

    // --- ЛОГИКА ЧАСТИЦ ---
    if (boss.state !== 'dying' && boss.state !== 'waiting') {
        if (boss.particles.length < 100 && Math.random() < 0.3) {
            const target = Math.random() > 0.5 ? boss : boss.hands[Math.floor(Math.random() * boss.hands.length)];
            if (target && target.width > 0) {
                boss.particles.push({
                    x: target.x + Math.random() * target.width,
                    y: target.y + Math.random() * target.height,
                    vx: (Math.random() - 0.5),
                    vy: -Math.random() * 2 - 1,
                    size: Math.random() * 3 + 1,
                    life: 1.0,
                    color: Math.random() > 0.5 ? '#00ccff' : '#ffffff'
                });
            }
        }
    }

    // Отрисовка существующих частиц
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; 
    // shadowBlur удален для производительности! 
    
    // Обратный цикл, чтобы безопасно удалять элементы через splice
    for (let i = boss.particles.length - 1; i >= 0; i--) {
        const p = boss.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;

        if (p.life <= 0) {
            boss.particles.splice(i, 1);
            continue; // Пропускаем отрисовку мертвой частицы
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, PI2);
        ctx.fill();
    }
    ctx.restore();

    // Отрисовка миньонов
    for (let i = 0; i < boss.minions.length; i++) {
        boss.minions[i].draw(ctx, assets);
    }

    // --- РИСУЕМ АУРЫ ---
    if (boss.state !== 'dying') {
        drawBackGlow(ctx, boss.x, boss.y, boss.width, boss.height);
        for (let i = 0; i < boss.hands.length; i++) {
            const h = boss.hands[i];
            if (h.width > 0) drawBackGlow(ctx, h.x, h.y, h.width, h.height);
        }
    }

    const cx = boss.x + boss.width / 2;
    const cy = boss.portalY || boss.y + boss.height / 2;

// --- КРАСИВЫЙ ПОРТАЛ СМЕРТИ (ЧЕРНАЯ ДЫРА) ---
    if (boss.state === 'dying') {
        const t = boss.timers.death;
        const portalX = cx; // Центр босса по X
        const portalY = boss.portalY || cy - 180; // Портал высоко в небе

        if (t >= 100 && t <= 350) {
            ctx.save();
            ctx.translate(portalX, portalY);
            
            // Расчет масштаба (открытие и закрытие)
            let scale = 1;
            if (t < 150) scale = (t - 100) * 0.02; // Раскрывается
            if (t > 320) scale = Math.max(0, 1 - (t - 320) * 0.05); // Схлопывается

            if (scale > 0) {
                ctx.scale(scale, scale);
                ctx.rotate(t * 0.05); // Общее вращение воронки

                // 1. Внешнее космическое свечение (Аура)
                ctx.globalCompositeOperation = 'lighter';
                const auraGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 220);
                auraGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                auraGrad.addColorStop(0.2, 'rgba(0, 150, 255, 0.8)');
                auraGrad.addColorStop(0.5, 'rgba(70, 0, 180, 0.4)');
                auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = auraGrad;
                ctx.beginPath();
                ctx.arc(0, 0, 220, 0, PI2);
                ctx.fill();

                // 2. Спиральные завихрения (рукава галактики)
                ctx.fillStyle = 'rgba(0, 220, 255, 0.3)';
                for (let i = 0; i < 4; i++) {
                    ctx.rotate(PI2 / 4);
                    ctx.beginPath();
                    ctx.moveTo(20, 0);
                    // Рисуем изогнутый "хвост" спирали
                    ctx.quadraticCurveTo(100, 120, 180, 0);
                    ctx.quadraticCurveTo(100, 40, 20, 0);
                    ctx.fill();
                }

                // 3. Засасывающиеся искры-звезды внутрь портала
                ctx.fillStyle = '#ffffff';
                for (let i = 0; i < 30; i++) {
                    // Искры двигаются по спирали в центр
                    const angle = (t * 0.15 + i * 0.5) % PI2;
                    const distance = 30 + ((i * 20 - t * 3 + 1000) % 150); 
                    
                    ctx.globalAlpha = Math.max(0, distance / 150); // Пропадают в центре
                    ctx.beginPath();
                    ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, 1.5 + (i%2), 0, PI2);
                    ctx.fill();
                }

                // 4. Сама Черная Дыра (ядро)
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(0, 0, 35, 0, PI2); // Абсолютно черный круг
                ctx.fill();
                
                // Внутренний горизонт событий (тонкая яркая кромка)
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    // --- ОТРИСОВКА БОССА ---
    // Используем современный синтаксис (Optional Chaining)
    const bodyImg = assets?.skeleton_boss;
    const armImg = assets?.skeleton_arm;

    // Левая рука
    if (boss.hands[1] && boss.hands[1].width > 0) {
        const h1 = boss.hands[1];
        ctx.save();
        ctx.translate(h1.x + h1.width / 2, h1.y + h1.height / 2);
        ctx.scale(-1, 1); 
        if (armImg?.complete) {
            ctx.drawImage(armImg, -h1.width / 2, -h1.height / 2, h1.width, h1.height);
        } else { 
            ctx.fillStyle = '#aaaaaa'; 
            ctx.fillRect(-h1.width / 2, -h1.height / 2, h1.width, h1.height); 
        }
        ctx.restore();
    }

    // Тело
    if (boss.width > 0) {
        if (bodyImg?.complete) {
            ctx.drawImage(bodyImg, boss.x, boss.y, boss.width, boss.height);
        } else { 
            ctx.fillStyle = "yellow"; 
            ctx.fillRect(boss.x, boss.y, boss.width, boss.height); 
        }
    }

    // Правая рука
    if (boss.hands[0] && boss.hands[0].width > 0) {
        const h0 = boss.hands[0];
        if (armImg?.complete) {
            ctx.drawImage(armImg, h0.x, h0.y, h0.width, h0.height);
        } else { 
            ctx.fillStyle = '#aaaaaa'; 
            ctx.fillRect(h0.x, h0.y, h0.width, h0.height); 
        }
    }
// --- ОТРИСОВКА СНАРЯДОВ (ВЕРНУЛИ ИХ!) ---
    if (boss.projectiles && boss.projectiles.length > 0) {
        const projImg = getProjectileCanvas();
        const offset = projImg.width / 2;

        ctx.save();
        // Используем 'lighter', чтобы снаряды красиво светились при наложении друг на друга
        ctx.globalCompositeOperation = 'lighter'; 
        
        for (let i = 0; i < boss.projectiles.length; i++) {
            const p = boss.projectiles[i];
            // Просто копируем картинку из кэша — это супер-быстро
            ctx.drawImage(projImg, p.x - offset, p.y - offset);
        }
        ctx.restore();
    }
    // Надежный сброс трансляций после закручивания портала
    if (boss.state === 'dying' && boss.timers.death >= 300) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
    }

    ctx.globalAlpha = 1.0;
    
    if (boss.state !== 'dying') drawHealthBar(boss, ctx, cx);

}

function drawHealthBar(boss, ctx, cx) {
    const w = 150; 
    const h = 10;
    const barY = boss.y - 30;

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(cx - 77, barY - 2, 154, 14); // Хардкод вычислений w/2 для микро-ускорения
    
    const pct = Math.max(0, boss.hp / boss.maxHp);
    
    if (boss.state === 'shadow') {
        ctx.fillStyle = "#888888";
    } else {
        ctx.fillStyle = pct > 0.5 ? "#00FF00" : (pct > 0.2 ? "orange" : "red"); 
    }
    ctx.fillRect(cx - 75, barY, w * pct, h);
}