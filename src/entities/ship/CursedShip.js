// src/entities/ship/CursedShip.js
import { world } from "../../world/World.js";
import { audioManager } from "../../core/AudioManager.js";

export class CursedShip {
    constructor(x, y, direction = 1) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.rotation = 0;
        this.globalScale = 1.5;

        // Состояния
        this.state = 'sleeping'; // 'sleeping', 'waking', 'awake', 'stopping', 'dead'
        this.isDead = false;
        this.playerTrapped = false;
        this.isExhausted = false;
        
        // Таймеры и флаги
        this.wakeTimer = 0;
        this.wakeDuration = 3.5;
        this.playedCracking = false;
        this.playedRoar = false;
        this.shouldStartMusic = false;
        
        // Визуальные эффекты
        this.shakeY = 0;
        this.particles = [];
        this.detachedParts = []; 
        
        // Кристалл
        this.crystalEjected = false;
        this.crystalVisual = null;
        this.crystalProximity = 0; 
        this.lastX = x;
        this.lastY = y;
        
        this.isBroken = false;
        this.isBeingCrushed = false; 

        this.wobbleVelocity = 0;   
        this.verticalVelocity = 0;
        this.impactVx = 0;
        this.opacity = 1.0; 
        this.isFading = false;

        this.musicStarted = false;

        const s = this.globalScale;
        const refX = 1185;
        const refY = 736;

        this.parts = [
            { id: 'deck', name: "deck", x: (1185 - refX) * s, y: (736 - refY) * s, w: 270 * s, h: 80 * s, sx: 1, sy: 1, rot: 0, z: 11, essential: true },
            { id: 'cabin', name: "cabin", x: (1353 - refX) * s, y: (678 - refY) * s, w: 100 * s, h: 60 * s, sx: 1, sy: 1, rot: 0, z: 10 },
            { id: 'm1', name: "mast", x: (1316 - refX) * s, y: ((578 - refY) + 20) * s, w: 40 * s, h: 150 * s, sx: 0.8, sy: 1.15, rot: 0, z: 10 },
            { id: 'm2', name: "mast", x: (1258 - refX) * s, y: ((615 - refY) + 20) * s, w: 40 * s, h: 150 * s, sx: 0.65, sy: 0.65, rot: 0, z: 9 },
            { id: 'm3', name: "mast", x: (1383 - refX) * s, y: ((570 - refY) + 20) * s, w: 40 * s, h: 150 * s, sx: 0.7, sy: 0.65, rot: 0, z: 9 },
            { id: 'side', name: "sideboard", x: (1254 - refX) * s, y: (657 - refY) * s, w: 200 * s, h: 80 * s, sx: 1, sy: 1, rot: 0, z: 16, essential: true }
        ];

        this.width = 270 * s;
        this.height = 150 * s;
        this.deckLevel = 0;
        this.eyeOffset = { x: 80 * s, y: 35 * s };
        this.crystalOffset = { x: 135 * s, y: -30 * s };

        this.baseSpeed = 80;
        this.maxSpeed = 850; 
        this.currentSpeed = 0;
    }

    detachPart() {
        const breakable = this.parts.filter(p => !p.essential);
        if (breakable.length === 0) return;

        const idx = Math.floor(Math.random() * breakable.length);
        const part = breakable[idx];

        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const lx = this.direction === 1 ? (this.width - part.x - part.w) : part.x;
        const rx = lx - this.width / 2;
        const ry = part.y - this.height / 2;

        const wx = this.x + this.width / 2 + (rx * cos - ry * sin);
        const wy = this.y + this.height / 2 + (rx * sin + ry * cos);

        const hitDirection = this.impactVx > 0 ? 1 : (this.impactVx < 0 ? -1 : (Math.random() > 0.5 ? 1 : -1));

        this.detachedParts.push({
            ...part,
            worldX: wx, 
            worldY: wy,
            vx: (Math.random() - 0.5) * 500 + (hitDirection * 200),
            vy: -100 - Math.random() * 350,
            vrot: (Math.random() - 0.5) * 20,
            life: 6.0
        });

        this.parts = this.parts.filter(p => p.id !== part.id);
        
        if (audioManager?.playSFX) audioManager.playSFX('world/ship/tree_cracking.wav', 0.6);
    }

    applyKrakenHit(power, directionX, isDeadly = false) {
        if (this.isBroken) return;

        if (power > 15) {
            this.detachPart();
            this.impactVx = directionX * power * 8; 
        } else {
            this.impactVx = directionX * power * 5;
        }

        this.wobbleVelocity += directionX * power * 0.4; 
        this.verticalVelocity += power * 15; 

        if (audioManager?.playSFX) audioManager.playSFX('world/ship/tree_cracking.wav', 0.6);

        if (isDeadly) {
            this.isBroken = true;
        }
    }

    startDeathSequence() {
        if (this.state === 'stopping' || this.state === 'dead') return;
        this.state = 'stopping';
    }

    update(dt, player) {
        // Логика отвалившихся кусков
        for (let i = this.detachedParts.length - 1; i >= 0; i--) {
            const p = this.detachedParts[i];
            p.vy += 800 * dt;
            p.worldX += p.vx * dt;
            p.worldY += p.vy * dt;
            p.rot += p.vrot * dt;
            p.life -= dt;
            if (p.life <= 0) this.detachedParts.splice(i, 1);
        }

// ИСПРАВЛЕНИЕ 3: Нормальный деспавн и потопление
        if (this.isBroken) {
            this.playerTrapped = false; // Освобождаем игрока
            
            // Сохраняем инерцию
            this.x += this.impactVx * dt;
            this.impactVx *= Math.pow(0.1, dt);

            // КОРАБЛЬ ИДЕТ КО ДНУ. 
            // Он медленно кренится в случайную сторону и тонет без шансов на всплытие
            this.rotation += 0.3 * dt * (this.impactVx > 0 ? 1 : -1); 
            this.y += 90 * dt; // Постоянная скорость ухода под воду

            // Плавно снижаем прозрачность, но дольше, чтобы игрок насладился катастрофой
            this.opacity -= 0.15 * dt; 
            if (this.opacity <= 0) {
                this.opacity = 0;
                this.isDead = true; 
            }
            
            return; // ПРЕРЫВАЕМ метод, вода больше не выталкивает этот корабль!
        }

        this.lastX = this.x;
        this.lastY = this.y;

        const hLeft = world.getFinalHeight(this.x);
        const hRight = world.getFinalHeight(this.x + this.width);
        const terrainAngle = Math.atan2(hRight - hLeft, this.width);
        const groundY = (hLeft + hRight) / 2;
        const waterData = world.getWaterData ? world.getWaterData(this.x + this.width / 2) : { isWater: false };
        this.isOnWater = waterData?.isWater && waterData.level <= groundY + 10;

        let targetSurfaceY = this.isOnWater ? waterData.level : groundY;

        if (this.isBeingCrushed) {
            this.sinkDepth = (this.sinkDepth || 0) + 50 * dt; 
            targetSurfaceY += this.sinkDepth; 
            
            this.time = (this.time || 0) + dt; 
            this.rotation += Math.sin(this.time * 2) * 0.01;
        }

        let currentSink = (this.isOnWater ? 120 : 88) * this.globalScale;
        const desiredY = targetSurfaceY - this.height + currentSink;

// Плавное движение по Y (Исправленная физика без эффекта попрыгунчика)
        const distToWater = desiredY - this.y;
        
        // Гравитация действует всегда, пока мы выше целевой поверхности
        if (distToWater > 0) {
            this.verticalVelocity += 1200 * dt;
        } else {
            // Архимедова (выталкивающая) сила: чем глубже под водой/землей, тем сильнее выталкивает
            this.verticalVelocity += distToWater * 12 * dt; 
        }

        // Сила трения (сопротивление среды) действует ВСЕГДА, тормозя излишне быстрые прыжки
        const waterFriction = this.isOnWater ? 0.01 : 0.2; // В воде торможение сильнее
        this.verticalVelocity *= Math.pow(waterFriction, dt);

        this.y += this.verticalVelocity * dt;

        // ИСПРАВЛЕНИЕ 2: Нормальное поведение на воде (убираем дерганья)
        let targetRotation = 0;
        if (this.isOnWater) {
            targetRotation = Math.sin(Date.now() / 500) * 0.04; // Плавная качка на воде
        } else {
            targetRotation = terrainAngle; // Повторяем рельеф только на суше
        }

        const friction = this.isBeingCrushed ? 0.001 : 0.3;
        const recoverySpeed = this.isBeingCrushed ? 2 : 15;

        this.wobbleVelocity += (targetRotation - this.rotation) * recoverySpeed * dt;
        this.wobbleVelocity *= Math.pow(friction, dt); 
        this.rotation += this.wobbleVelocity * dt;

        // Обнуляем скорость, если нас держат
        if (this.isBeingCrushed) {
            this.currentSpeed = 0;
            this.impactVx = 0;
        }

        const canMove = (this.state === 'awake' || this.state === 'stopping');
        this.x += (this.impactVx + (this.currentSpeed * (canMove ? this.direction : 0))) * dt;
        this.impactVx *= Math.pow(friction, dt);

        this.updateStateLogic(dt, player);
        this.keepPlayerOnBoard(player);
        this.updateParticles(dt, this.getCrystalWorldCoords(), this.getEyeWorldCoords(), targetSurfaceY);

        if (this.crystalEjected && this.crystalVisual) {
            const cv = this.crystalVisual;
            cv.vy += cv.gravity * dt;
            cv.x += cv.vx * dt;
            cv.y += cv.vy * dt;
            cv.rotation += dt * 5;
        }
    }

    updateStateLogic(dt, player) {
        if (this.state === 'sleeping') {
            const pivotX = this.x + this.width / 2;
            const dx = (player.x + player.size / 2) - pivotX;
            const worldDeckY = this.y + this.deckLevel + this.shakeY + (Math.tan(this.rotation) * dx);
            
            const isOnDeckX = player.x > this.x && player.x < this.x + this.width;
            const isTouchingDeckY = player.y + player.size >= worldDeckY - 20 && player.y + player.size <= worldDeckY + 40;

            if (isOnDeckX && isTouchingDeckY && player.velocityY >= 0) {
                this.state = 'waking';
                this.playerTrapped = true;
                this.shouldStartMusic = true; 

                // ИСПРАВЛЕНИЕ 1: Вернул старый путь аудио и громкость 0.6
                if (audioManager?.playSFX && !this.playedCracking) {
                    audioManager.playSFX('world/ship/tree_cracking.wav', 0.6);
                    this.playedCracking = true;
                }
            }
        } 
        else if (this.state === 'waking') {
            this.wakeTimer += dt;
            this.shakeY = (Math.random() - 0.5) * 12; 

            if (this.wakeTimer > 1.5 && !this.playedRoar) {
                if (audioManager?.playSFX) {
                    audioManager.playSFX('world/ship/roar.wav', 0.8);
                }
                this.playedRoar = true;
            }

            if (this.wakeTimer >= this.wakeDuration) {
                this.state = 'awake';
                this.shakeY = 0;
            }
        } 
        else if (this.state === 'awake') {
            const distToCrystal = Math.abs(player.x - (this.x + this.width / 2));
            this.crystalProximity = Math.max(0, Math.min(1, 1 - (distToCrystal / 500)));
            this.currentSpeed = this.baseSpeed + (this.maxSpeed - this.baseSpeed) * this.crystalProximity;
        } 
        else if (this.state === 'stopping') {
            this.currentSpeed *= Math.pow(0.5, dt);
            this.shouldStartMusic = false; 

            if (this.currentSpeed < 15) {
                this.currentSpeed = 0;
                this.ejectCrystal();
                this.state = 'dead';
                this.isExhausted = true;
            }
        }
    }

    ejectCrystal() {
        this.crystalEjected = true;
        this.playerTrapped = false;
        const coords = this.getCrystalWorldCoords();
        this.crystalVisual = {
            x: coords.x, y: coords.y,
            vx: this.direction * 150, vy: -400,
            gravity: 800, rotation: 0
        };
    }

    keepPlayerOnBoard(player) {
        const pivotX = this.x + this.width / 2;
        const offsetX = (player.x + player.size / 2) - pivotX;
        const worldDeckY = this.y + this.deckLevel + this.shakeY + (Math.tan(this.rotation) * offsetX);

        if (player.x + player.size > this.x && player.x < this.x + this.width) {
            const dist = (player.y + player.size) - worldDeckY;
            if (player.velocityY >= 0 && dist > -30 && dist < 50) {
                player.y = worldDeckY - player.size;
                player.velocityY = 0;
                player.onGround = true;
                player.rotation = this.rotation;
                player.x += (this.x - this.lastX);
                player.y += (this.y - this.lastY);
            }
        }

        if (this.playerTrapped) {
            const limit = 40;
            if (player.x < this.x + limit) player.x = this.x + limit;
            if (player.x > this.x + this.width - limit) player.x = this.x + this.width - limit;
        }
    }

    getCrystalWorldCoords() {
        const cx = this.direction === 1 ? (this.width - this.crystalOffset.x) : this.crystalOffset.x;
        return { x: this.x + cx, y: this.y + this.crystalOffset.y + this.shakeY };
    }

    getEyeWorldCoords() {
        const ex = this.direction === 1 ? (this.width - this.eyeOffset.x) : this.eyeOffset.x;
        return { x: this.x + ex, y: this.y + this.eyeOffset.y + this.shakeY };
    }

    updateParticles(dt, crystalCoords, eyeCoords) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
        if (this.state === 'awake' && Math.random() < 0.2) {
            this.particles.push({
                x: crystalCoords.x, y: crystalCoords.y,
                vx: (Math.random() - 0.5) * 40, vy: -Math.random() * 50,
                life: 1.5, maxLife: 1.5, size: Math.random() * 3 + 2,
                color: `rgba(0, 255, 100, ${0.5 + Math.random() * 0.5})`
            });
        }
    }

    applyGlobalTransform(ctx) {
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        if (this.direction === 1) ctx.scale(-1, 1);
        ctx.translate(-this.width / 2, -this.height / 2);
    }

    renderPart(ctx, assets, part, isDetached = false) {
        const img = assets[part.name.replace('.png', '')];
        if (!img?.complete) return;
        ctx.save();
        if (isDetached) ctx.translate(part.worldX, part.worldY);
        else ctx.translate(part.x, part.y);
        if (part.rot !== 0) ctx.rotate(part.rot * Math.PI / 180);
        ctx.scale(part.sx, part.sy);
        ctx.drawImage(img, 0, 0, part.w, part.h);
        ctx.restore();
    }

    drawBack(ctx, assets) {
        if (this.opacity <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.opacity; 

        this.detachedParts.filter(p => p.z < 15).forEach(p => this.renderPart(ctx, assets, p, true));

        ctx.save();
        ctx.translate(0, this.shakeY);
        this.applyGlobalTransform(ctx);
        this.parts.filter(p => p.z < 15).sort((a, b) => a.z - b.z).forEach(part => this.renderPart(ctx, assets, part));
        
        if (this.state === 'awake' && !this.crystalEjected && assets.cursed_crystal?.complete) {
            const bounce = Math.sin(Date.now() / 300) * 8;
            ctx.drawImage(assets.cursed_crystal, this.crystalOffset.x - 10, this.crystalOffset.y + bounce, 20, 20);
        }
        ctx.restore();
        ctx.restore(); 
    }

    drawFront(ctx, assets) {
        this.detachedParts.filter(p => p.z >= 15).forEach(p => this.renderPart(ctx, assets, p, true));

        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(0, this.shakeY);
        this.applyGlobalTransform(ctx);
        this.parts.filter(p => p.z >= 15).forEach(part => this.renderPart(ctx, assets, part));
        
        if (this.state !== 'dead' && this.state !== 'sleeping') {
            ctx.fillStyle = `rgba(0, 255, 50, ${0.6 + Math.sin(Date.now()/150)*0.4})`;
            ctx.beginPath(); ctx.arc(this.eyeOffset.x, this.eyeOffset.y, 4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();

        if (this.crystalEjected && this.crystalVisual && assets.cursed_crystal) {
            ctx.save();
            ctx.translate(this.crystalVisual.x, this.crystalVisual.y);
            ctx.rotate(this.crystalVisual.rotation);
            ctx.drawImage(assets.cursed_crystal, -12, -12, 24, 24);
            ctx.restore();
        }

        for (let p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    getLights() {
        if (this.state === 'dead' || this.state === 'sleeping') return [];
        const crystal = this.getCrystalWorldCoords();
        return [{
            x: crystal.x, y: crystal.y,
            radius: 200 * this.crystalProximity,
            intensity: 1, color: "rgba(0, 255, 100, 0.6)"
        }];
    }
}