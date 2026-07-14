// Файл: src/entities/bosses/ocean_boss/OceanProjectiles.js
export class HomingCyclone {
    constructor(x, y, target, phase) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.speed = phase === 3 ? 450 : (phase === 2 ? 350 : 250);
        this.lifeTime = 6; 
        this.damage = 35; 
        this.hitboxRadius = 25;
        this.active = true;
        this.rotation = 0; 
    }

    // Добавляем свет для циклона
    getLightSources() {
        if (!this.active) return [];
        return [{
            x: this.x,
            y: this.y,
            radius: this.hitboxRadius * 5, // Радиус освещения тьмы
            intensity: 0.6,
            isCursedCrystal: true // Зеленый свет
        }];
    }

    update(dt) { 
        this.lifeTime -= dt;
        if (this.lifeTime <= 0) this.active = false;
        
        this.rotation += dt * 15; 
        
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        if (dist < this.hitboxRadius + (this.target.size || 20) / 2) {
            if (typeof this.target.takeDamage === 'function') {
                this.target.takeDamage(this.damage);
                this.active = false; 
                this.lifeTime = 0;
            }
        }
    }

    draw(ctx, assets) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Включаем Screen для усиления свечения самих текстур
        ctx.globalCompositeOperation = 'screen';
        ctx.shadowColor = "#00ff66";
        ctx.shadowBlur = 15;

        ctx.strokeStyle = "rgba(0, 255, 100, 0.9)"; 
        ctx.lineWidth = 4;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.hitboxRadius, 0, Math.PI * 0.8);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, this.hitboxRadius, Math.PI, Math.PI * 1.8);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(0, 0, this.hitboxRadius * 0.5, 0, Math.PI * 1.5);
        ctx.stroke();

        ctx.restore();
    }
}

export class LaserBeam {
    constructor(boss) {
        this.boss = boss;
        this.angle = 0;
        this.length = 2500; 
        this.state = 'telegraph'; 
        this.damage = 60; 
        this.thickness = 80; // Сделаем лазер еще толще при выстреле
        this.active = true;
        this.lifeTime = 999;
    }

    updateTelegraph(angle) { this.angle = angle; }
    
    fire(angle) {
        this.angle = angle;
        this.state = 'active';
    }

    updateAngle(angle) { if (this.state === 'active') this.angle = angle; }

    destroy() {
        this.active = false;
        this.lifeTime = 0; 
    }

    getCrystalWorldPos() {
        const cosR = Math.cos(this.boss.rotation || 0);
        const sinR = Math.sin(this.boss.rotation || 0);
        return {
            x: this.boss.x + (this.boss.crystalOffsetX * cosR - this.boss.crystalOffsetY * sinR),
            y: this.boss.y + (this.boss.crystalOffsetX * sinR + this.boss.crystalOffsetY * cosR)
        };
    }

    // РАЗГОНЯЕМ СВЕТ ОТ ЛАЗЕРА ВО ТЬМЕ
    getLightSources() {
        if (!this.active) return [];
        let sources = [];
        const pos = this.getCrystalWorldPos();
        
        if (this.state === 'telegraph') {
            // Тонкая линия дает немного света в начале
            sources.push({ x: pos.x, y: pos.y, radius: 150, intensity: 0.5, isCursedCrystal: true });
        } else if (this.state === 'active') {
            // Когда стреляет, весь луч разрывает тьму несколькими точками!
            for (let i = 0; i <= 5; i++) {
                sources.push({
                    x: pos.x + Math.cos(this.angle) * (this.length * (i / 5)),
                    y: pos.y + Math.sin(this.angle) * (this.length * (i / 5)),
                    radius: 500, // Огромные дыры во тьме
                    intensity: 1.0,
                    isCursedCrystal: true
                });
            }
        }
        return sources;
    }

    update(dt, player) {
        if (!this.active || this.state !== 'active' || !player) return;

        const pos = this.getCrystalWorldPos();
        const startX = pos.x;
        const startY = pos.y; 
        
        const playerDX = player.x - startX;
        const playerDY = player.y - startY;
        
        const laserDirX = Math.cos(this.angle);
        const laserDirY = Math.sin(this.angle);
        
        const projection = playerDX * laserDirX + playerDY * laserDirY;
        
        if (projection > 0 && projection < this.length) {
            const closestX = startX + laserDirX * projection;
            const closestY = startY + laserDirY * projection;
            const distToLaser = Math.hypot(player.x - closestX, player.y - closestY);

            if (distToLaser < this.thickness / 2 + (player.size || 20) / 2) {
                if (typeof player.takeDamage === 'function') {
                    player.takeDamage(this.damage * dt * 5); 
                }
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        const pos = this.getCrystalWorldPos();
        const startX = pos.x;
        const startY = pos.y;
        const endX = startX + Math.cos(this.angle) * this.length;
        const endY = startY + Math.sin(this.angle) * this.length;

        ctx.save();
        // Режим 'screen' делает цвета кислотными и складывает их
        ctx.globalCompositeOperation = 'screen'; 

        if (this.state === 'telegraph') {
            // ТОНКАЯ ЗЕЛЕНАЯ ПОЛОСКА (вместо красного пунктира)
            ctx.shadowColor = "#00ff00";
            ctx.shadowBlur = 10;
            ctx.strokeStyle = "rgba(0, 255, 100, 0.8)"; 
            ctx.lineWidth = 2; // Тонкая
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        } 
        else if (this.state === 'active') {
            // ЛАЗЕР РАСШИРЯЕТСЯ В НЕСКОЛЬКО РАЗ И СИЯЕТ
            ctx.shadowColor = "#00ff66";
            
            // Внешнее свечение (очень широкое)
            ctx.shadowBlur = 40;
            ctx.strokeStyle = "rgba(0, 255, 100, 0.3)";
            ctx.lineWidth = this.thickness * 1.5; 
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Основной луч (поярче)
            ctx.shadowBlur = 20;
            ctx.strokeStyle = "rgba(0, 255, 150, 0.8)";
            ctx.lineWidth = this.thickness * 0.7;
            ctx.stroke();

            // Белое раскаленное ядро в центре лазера
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#ffffff";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = this.thickness * 0.25;
            ctx.stroke();
        }
        ctx.restore();
    }
}