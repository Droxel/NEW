// SkeletonMinion.js
import { mobManager } from "../mobs/MobManager.js";

export class SkeletonMinion {
    constructor(x, y, player) {
        this.x = x;
        this.y = y;
        this.player = player;
        
        this.width = 45;
        this.height = 45;
        this.vx = 0;
        this.vy = 0;
        
        this.state = 'chasing';
        this.timer = 0;
        this.isAlive = true;

        // --- ОБЯЗАТЕЛЬНО ДЛЯ СИСТЕМЫ УРОНА ---
        this.hp = 20;            // Здоровье (можно настроить)
        this.isDead = false;     // Пули проверяют этот флаг
        this.markedForDeletion = false; // MobManager удалит его при true
        // ------------------------------------
        
        this.speed = 2;
        this.fuseTime = 60;
        this.explosionRadius = 120;
        this.damage = 20;
    }

    // ЭТОТ МЕТОД ВЫЗЫВАЕТСЯ ПУЛЯМИ И ПРИ ПРЫЖКЕ СВЕРХУ
    takeDamage(amount) {
        if (this.isDead || !this.isAlive) return;
        
        this.hp -= amount;
        
        // Визуальный эффект получения урона (зеленые частицы)
        if (mobManager.spawnUraniumParticle) {
            mobManager.spawnUraniumParticle(this.x + this.width/2, this.y + this.height/2);
        }

        if (this.hp <= 0) {
            this.deathByPlayer(); 
        }
    }

    deathByPlayer() {
        if (this.isDead) return;
        this.isDead = true;
        
        // Логика: если убили пулей, он все равно взрывается, 
        // но можно добавить шанс выпадения кристалла
        if (Math.random() < 0.5) {
            mobManager.spawnDrop(this.x + this.width/2, this.y + this.height/2);
        }
        
        this.explode();
    }

    update() {
        if (!this.isAlive || this.isDead) return;

        // Гравитация и столкновения
        this.vy += 0.5;
        this.y += this.vy;
        if (mobManager.isPointInWall(this.x + this.width / 2, this.y + this.height)) {
            this.y -= this.vy;
            this.vy = 0;
        }

        const dx = this.player.x - this.x;
        const dist = Math.abs(dx);

        switch (this.state) {
            case 'chasing':
                this.vx = Math.sign(dx) * this.speed;
                this.x += this.vx;
                // Если подошел вплотную к игроку - запускаем таймер взрыва
                if (dist < 50) {
                    this.state = 'fuse';
                    this.timer = 0;
                }
                break;

            case 'fuse':
                this.timer++;
                this.vx *= 0.8; // Замедляется перед взрывом
                this.x += this.vx;
                if (this.timer >= this.fuseTime) {
                    this.explode();
                }
                break;
        }
    }

    explode() {
        this.isAlive = false;
        this.isDead = true;
        this.markedForDeletion = true; 
        
        const dx = this.player.x - (this.x + this.width/2);
        const dy = this.player.y - (this.y + this.height/2);
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Урон игроку, если он в радиусе
        if (dist < this.explosionRadius) {
            if (this.player.takeDamage) this.player.takeDamage(this.damage);
        }
        
        // Можно добавить эффект взрыва через частицы
        if (mobManager.spawnUraniumParticle) {
            for(let i=0; i<3; i++) mobManager.spawnUraniumParticle(this.x, this.y);
        }
    }

    draw(ctx, assets) {
        if (!this.isAlive || this.isDead) return;

        ctx.save();
        // Эффект мигания перед взрывом
        if (this.state === 'fuse') {
            const flash = Math.sin(this.timer * 0.5) > 0;
            if (flash) {
                ctx.filter = 'brightness(2) sepia(1) hue-rotate(-50deg)';
                ctx.translate((Math.random()-0.5)*4, 0);
            }
        }

        const img = assets ? assets.skeleton_minion : null;
        if (img && img.complete) {
            if (this.player.x < this.x) {
                ctx.translate(this.x + this.width, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(img, 0, 0, this.width, this.height);
            } else {
                ctx.drawImage(img, this.x, this.y, this.width, this.height);
            }
        } else {
            // Фолбек отрисовка
            ctx.fillStyle = this.state === 'fuse' ? 'white' : '#999';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.restore();
    }
}