// Файл: src/entities/bosses/ocean_boss/OceanBossRenderer.js

export class OceanBossRenderer {
    constructor(boss) {
        this.boss = boss;
    }

    draw(ctx, assets) {
        ctx.save();
        
        const b = this.boss;
        
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rotation || 0);

        const drawX = -b.width / 2;
        const drawY = -b.height / 2; 

        let currentImg = null;
        if (assets) {
            if (b.eyeState === 0) currentImg = assets.ocean_boss2;
            if (b.eyeState === 1) currentImg = assets.ocean_boss1;
            if (b.eyeState === 2) currentImg = assets.ocean_boss;
        }

        ctx.globalAlpha = b.alpha !== undefined ? b.alpha : 1;

        if (b.invulTimer > 0) {
            ctx.globalAlpha = Math.min(ctx.globalAlpha, 0.5); 
        }

        if (b.attacks && b.attacks.currentAttack === 'ram' && b.attacks.attackState === 'active') {
            for (let i = 1; i < 5; i++) {
                ctx.globalAlpha = (0.3 / i) * b.alpha;
                let trailX = drawX - (b.attacks.dashDir * i * 80);
                if (currentImg && currentImg.complete) {
                    ctx.drawImage(currentImg, trailX, drawY, b.width, b.height);
                }
            }
            ctx.globalAlpha = b.alpha; 
        }

        if (currentImg && currentImg.complete && currentImg.naturalWidth !== 0) {
            ctx.drawImage(currentImg, drawX, drawY, b.width, b.height);
        } else {
            ctx.fillStyle = "#102a45";
            ctx.fillRect(drawX, drawY, b.width, b.height);
        }
        
        ctx.globalAlpha = 1.0;

        if (b.state === 'combat' || b.eyeState === 2) {
            const crystalX = b.crystalOffsetX; 
            const crystalY = b.crystalOffsetY; 
            
            let glow = Math.sin(Date.now() / 150) * 10 + 20;
            if (b.attacks && b.attacks.attackState === 'telegraph') {
                glow = Math.sin(Date.now() / 30) * 40 + 50; 
            }

            const crystalColor = b.phase === 3 ? "#00ff00" : "#33cc33";

            ctx.save(); 
            ctx.globalCompositeOperation = 'screen'; 
            
            ctx.shadowColor = crystalColor; 
            ctx.shadowBlur = glow * 1.5; 
            
            ctx.fillStyle = crystalColor;
            ctx.beginPath();
            ctx.arc(crystalX, crystalY, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; 
            
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(crystalX - 3, crystalY - 3, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        ctx.restore(); // Выходим из локальной матрицы босса

        // --- ОБНОВЛЕННАЯ СИЯЮЩАЯ И ПУЛЬСИРУЮЩАЯ ЗАЩИТНАЯ СФЕРА ---
        if (b.krakenActive) {
            ctx.save();
            // Сфера теперь центрируется ровно по боссу
            ctx.translate(b.sphereX, b.sphereY);
            
            // Рассчитываем динамическую пульсацию радиуса сферы (раз в 250мс)
            const baseRadius = b.height * 0.55; // Оптимальный размер, чтобы укрыть босса 250х350
            const pulseAmount = Math.sin(Date.now() / 250) * 12; // амплитуда пульсации в пикселях
            const radius = baseRadius + pulseAmount;
            
            // Настройка режима наложения и размытия теней для сияния (неоновый бирюзово-зеленый)
            ctx.globalCompositeOperation = 'screen'; 
            ctx.shadowColor = "#00ffcc";
            ctx.shadowBlur = 30 + Math.sin(Date.now() / 120) * 10; // Сияние тоже слегка пульсирует
            
            // 1. Создаем объемный радиальный градиент внутри сферы
            const gradient = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, radius);
            gradient.addColorStop(0, 'rgba(0, 255, 150, 0.02)');  // Прозрачный центр, чтобы босса было хорошо видно
            gradient.addColorStop(0.7, 'rgba(0, 255, 200, 0.12)'); // Насыщение к краям
            gradient.addColorStop(0.9, 'rgba(0, 180, 255, 0.25)');
            gradient.addColorStop(1, 'rgba(0, 255, 220, 0.6)');    // Яркая энергетическая кромка
            
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // 2. Рисуем основной пульсирующий контур
            ctx.lineWidth = 5 + Math.sin(Date.now() / 100) * 1.5;
            ctx.strokeStyle = `rgba(0, 255, 200, ${0.75 + Math.sin(Date.now() / 150) * 0.25})`;
            ctx.stroke();

            // 3. Дополнительное тонкое орбитальное кольцо вокруг для технологичного/магического вида
            ctx.beginPath();
            ctx.arc(0, 0, radius + 15, 0, Math.PI * 2);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = `rgba(0, 200, 255, ${0.25 + Math.sin(Date.now() / 300) * 0.15})`;
            ctx.stroke();
            
            // Возвращаем стандартные тени и режим рисования перед отрисовкой полоски ХП
            ctx.shadowBlur = 0;
            ctx.globalCompositeOperation = 'source-over';

            // 4. Аккуратная полоска ХП Сферы (БЕЗ ТЕКСТА)
            const hpWidth = 180;
            const hpHeight = 10; // Сделали чуть тоньше и эстетичнее
            const hpPercent = Math.max(0, b.sphereHp / b.maxSphereHp);
            const barY = -radius - 25; // Привязана к радиусу (двигается вверх-вниз в такт пульсации!)

            // Задний фон полоски
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(-hpWidth / 2, barY, hpWidth, hpHeight);
            
            // Зеленое неоновое заполнение
            ctx.fillStyle = "#00ff66"; 
            ctx.fillRect(-hpWidth / 2, barY, hpWidth * hpPercent, hpHeight);
            
            // Белая рамка
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-hpWidth / 2, barY, hpWidth, hpHeight);

            ctx.restore();
        }
    }
    
    drawHealthBar(ctx, x, y, width, hp, maxHp, phase) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(x, y, width, 14);
        ctx.fillStyle = phase === 3 ? "#ff0044" : (phase === 2 ? "#ffaa00" : "#00ffcc");
        ctx.fillRect(x + 2, y + 2, (width - 4) * Math.max(0, hp / maxHp), 10);
    }
}