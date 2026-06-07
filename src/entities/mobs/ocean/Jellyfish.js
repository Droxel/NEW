//Jellyfish.js
import { BaseSeaCreature } from "./BaseSeaCreature.js";

export class Jellyfish extends BaseSeaCreature {
    constructor(x, y) {
        super(x, y, 45, 50); 
        this.imgKey = "miduza2";
        this.pulseTimer = 1 + Math.random() * 2;
        this.isPushing = false;
        this.isPreparing = false;
        
        this.rotation = Math.random() * Math.PI * 2;
        
        // --- ПАРАМЕТРЫ НАКЛОНА КАРТИНКИ ---
        // Если медуза нарисована из верхнего-левого в нижний-правый, 
        // её внутренний угол примерно 45 градусов.
        this.internalAngle = Math.PI / 4; 

        this.scaleX = 1;
        this.scaleY = 1;
        this.baseW = 45;
        this.baseH = 50;
    }

    update(dt, player, world) {
        this.pulseTimer -= dt;

        if (this.pulseTimer <= 0) {
            if (!this.isPushing && !this.isPreparing) {
                this.isPreparing = true;
                this.pulseTimer = 0.5;
                this.imgKey = "miduza2";
            } 
            else if (this.isPreparing) {
                this.isPreparing = false;
                this.isPushing = true;
                this.imgKey = "miduza1";
                this.pulseTimer = 0.8; 

                const randomAngle = Math.random() * Math.PI * 2;
                const force = 1.2 + Math.random() * 0.8; 
                this.vx = Math.cos(randomAngle) * force;
                this.vy = Math.sin(randomAngle) * force;
                
                // Направление вращения
                this.rotation = randomAngle;
            } 
            else {
                this.isPushing = false;
                this.imgKey = "miduza2";
                this.pulseTimer = 2 + Math.random() * 2;
            }
        }

        // Логика масштабирования
        let targetScaleX = 1;
        let targetScaleY = 1;

        if (this.isPreparing) {
            targetScaleX = 1.3; // Сильнее сплющиваем в бока
            targetScaleY = 0.7; // И сильнее сжимаем по вектору тела
        } else if (this.isPushing) {
            targetScaleX = 0.8; // Вытягиваемся
            targetScaleY = 1.3;
        }

        this.scaleX += (targetScaleX - this.scaleX) * 0.1;
        this.scaleY += (targetScaleY - this.scaleY) * 0.1;

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.97;
        this.vy *= 0.97;

        const waterData = world.getWaterData(this.x);
        if (waterData.isWater) {
            const margin = this.h / 2;
            if (this.y < waterData.level + margin) { this.y = waterData.level + margin; this.vy *= -0.5; }
            if (this.y > waterData.bottom - margin) { this.y = waterData.bottom - margin; this.vy *= -0.5; }
        }
    }

    draw(ctx, assets) {
        const img = assets[this.imgKey];
        if (!img) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 1. Поворачиваем к вектору движения
        ctx.rotate(this.rotation + Math.PI / 2);
        
        // 2. Убираем внутренний наклон самой картинки, чтобы "выпрямить" медузу в памяти
        ctx.rotate(-this.internalAngle);

        // 3. Теперь применяем масштаб. Так как мы "выпрямили" медузу, 
        // scaleY будет сжимать её точно от головы к хвосту, а scaleX — в бока.
        const breath = Math.sin(Date.now() * 0.003) * 0.03;
        ctx.scale(this.scaleX + breath, this.scaleY - breath);

        // 4. Возвращаем наклон картинки обратно, чтобы она выглядела как в спрайте
        ctx.rotate(this.internalAngle);

        ctx.drawImage(img, -this.baseW / 2, -this.baseH / 2, this.baseW, this.baseH);
        ctx.restore();
    }
}