// BaseSeaCreature.js
export class BaseSeaCreature {
    constructor(x, y, baseWidth, baseHeight) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        
        const scale = 0.8 + Math.random() * 0.4;
        this.w = baseWidth * scale;
        this.h = baseHeight * scale;

        this.imgKey = "";
        this.direction = -1; 
        this.markedForDeletion = false;
        this.speed = 1 + Math.random() * 1.5; 
    }

    update(dt, player, world) {
        // 1. Логика страха
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        if (distToPlayer < 180) {
            const angle = Math.atan2(this.y - player.y, this.x - player.x);
            this.vx += Math.cos(angle) * 0.5;
            this.vy += Math.sin(angle) * 0.5;
        }

        // 2. Движение
        this.x += this.vx;
        this.y += this.vy;

        // 3. Трение
        this.vx *= 0.97;
        this.vy *= 0.97;

        // --- ГЛОБАЛЬНЫЕ ОГРАНИЧЕНИЯ (Исправление бага) ---
        
        const waterData = world.getWaterData(this.x);
        const groundY = world.getFinalHeight(this.x); // Реальная высота земли
        const margin = this.h / 2;

        if (waterData.isWater) {
            // ФИЗИКА ВНУТРИ ВОДЫ
            const surfacePadding = 20; 
            const bottomPadding = 10;

            // Не даем выпрыгнуть в воздух
            if (this.y < waterData.level + margin + surfacePadding) { 
                this.y = waterData.level + margin + surfacePadding; 
                this.vy *= -0.5; // Отскок вниз
            }

            // Не даем уйти под дно (используем groundY для точности)
            const limitBottom = Math.min(waterData.bottom, groundY);
            if (this.y > limitBottom - margin - bottomPadding) { 
                this.y = limitBottom - margin - bottomPadding; 
                this.vy *= -0.5; 
            }
        } else {
            // ФИЗИКА ВНЕ ВОДЫ (Если рыбу "вытолкнули" или случился баг)
            // 1. Если рыба выше уровня земли (в воздухе) -> мгновенно возвращаем в воду или "убиваем"
            // Но лучше просто прижать к ближайшей границе земли
            if (this.y < groundY) {
                // Если мы вне воды и выше земли — значит мы в воздухе. 
                // Тянем рыбу вниз к земле/воде
                this.vy += 0.5; // "Гравитация" для заблудших рыб
            }

            // 2. Жесткий барьер земли (чтобы не плавали в текстурах берега)
            if (this.y > groundY - margin) {
                this.y = groundY - margin;
                this.vy *= -0.2;
                // Если рыба на суше, заставляем её дергаться в сторону воды
                this.vx += (this.x > player.x ? 0.2 : -0.2); 
            }
            
            // 3. Если рыба слишком далеко от воды (на суше), помечаем на удаление
            // чтобы не засорять мир "летающими" рыбами
            this.markedForDeletion = true;
        }

        if (Math.abs(this.vx) > 0.1) {
            this.direction = this.vx > 0 ? 1 : -1;
        }
    }

    draw(ctx, assets) {
        const img = assets[this.imgKey];
        if (!img) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        const angle = Math.atan2(this.vy, this.vx);
        if (Math.cos(angle) > 0) {
            ctx.scale(-1, 1);
            ctx.rotate(-angle); 
        } else {
            ctx.rotate(angle + Math.PI);
        }

        ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }
}