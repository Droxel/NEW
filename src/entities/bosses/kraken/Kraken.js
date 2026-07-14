// Kraken.js
import { updateKrakenLogic, selectNextAction } from './KrakenAttack.js';

export class Kraken {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.time = 0;
        this.flipX = 1;

        // --- СТЕЙТ-МАШИНА КРАКЕНА ---
        this.state = 'RISING'; 
        this.stateTimer = 0;
        this.alpha = 1.0; 
        this.attackPhase = 0; // 0 - промахи, 1 - хлыст, 2 - мертвая хватка
        this.missCount = 0;
        this.targetTentacle = null; 
        this.attackQueue = [];

        // --- БИОНИКА ---
        this.wiggleIntensity = 1.0;
        this.swimSpeed = 2.0; 
        this.hasHitThisAttack = false;

        // Конфигурация анатомии щупалец
        this.tentacles = [
            { id: 0, defaultAngle: Math.PI * 0.8, ox: -160, oy: 60, phase: 0.0, speed: 0.8, swing: 0.15 },
            { id: 1, defaultAngle: Math.PI * 0.65, ox: -100, oy: 100, phase: 1.5, speed: 0.6, swing: 0.10 },
            { id: 2, defaultAngle: Math.PI * 0.55, ox: -50,  oy: 120, phase: 3.1, speed: 0.9, swing: 0.12 },
            { id: 3, defaultAngle: Math.PI * 0.5, ox: 0,   oy: 140, phase: 4.5, speed: 0.7, swing: 0.10, isMain: true },
            { id: 4, defaultAngle: Math.PI * 0.45, ox: 50,  oy: 120, phase: 0.8, speed: 0.8, swing: 0.12 },
            { id: 5, defaultAngle: Math.PI * 0.35, ox: 100,  oy: 100, phase: 2.2, speed: 0.5, swing: 0.10 },
            { id: 6, defaultAngle: Math.PI * 0.2, ox: 160,  oy: 60, phase: 5.0, speed: 0.7, swing: 0.15 },
            { id: 7, defaultAngle: Math.PI * 0.5, ox: -20,  oy: 50,  phase: 1.0, speed: 0.4, swing: 0.05 }
        ].map(t => ({
            ...t,
            currentAngle: 0, 
            targetAngle: 0,  
            wrapAmount: 4,   
            targetWrap: 0,
            tension: 0,      
            targetTension: 0
        }));

        this.parts = [
            { name: "tentacles1", w: 100, h: 200, sx: 1.35, sy: 0.9 },
            { name: "tentacles1", w: 100, h: 200, sx: 1.3, sy: 0.75 },
            { name: "tentacles1", w: 100, h: 200, sx: 1.35, sy: 0.7 },
            { name: "tentacles2", w: 100, h: 100, sx: 1.2, sy: 1.25 },
            { name: "tentacles10", w: 100, h: 100, sx: 1.2, sy: 1.2 },
            { name: "tentacles2", w: 100, h: 100, sx: 1.1, sy: 1.0 },
            { name: "tentacles2", w: 100, h: 100, sx: 1.0, sy: 1.0 },
            { name: "tentacles3", w: 100, h: 100, sx: 1.0, sy: 1.0 },
            { name: "tentacles4", w: 100, h: 100, sx: 1.0, sy: 1.0 },
            { name: "tentacles5", w: 100, h: 100, sx: 1.0, sy: 1.0 },
            { name: "tentacles5", w: 100, h: 100, sx: 1.0, sy: 1.0 },
            { name: "tentacles6", w: 100, h: 100, sx: 1.0, sy: 1.0 },
            { name: "tentacles6", w: 100, h: 100, sx: 1.0, sy: 1.0 },
            { name: "tentacles7", w: 80, h: 100, sx: 1.0, sy: 1.0 },
            { name: "tentacles8", w: 80, h: 100, sx: 1.0, sy: 1.0 },
            { name: "tentacles9", w: 40, h: 100, sx: 1.0, sy: 1.0 }
        ];
    }

    // Вспомогательные функции интерполяции (Easing)
    lerp(a, b, t) { return a + (b - a) * t; }
    lerpAngle(a, b, t) {
        const d = b - a;
        const delta = ((d + Math.PI) % (Math.PI * 2)) - Math.PI;
        return a + delta * t;
    }
    easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    // Главный метод обновления
    update(dt, targetShip) {
        // Вызываем вынесенную логику из внешнего файла и передаем себя (this)
        updateKrakenLogic(this, dt, targetShip);
    }

    // Вспомогательный метод смены состояний
    changeState(newState) {
        this.state = newState;
        this.stateTimer = 0;
        this.hasHitThisAttack = false; 
        console.log(`Кракен перешел в фазу: ${newState}`);
    }

    // Внешний вызов для старта серии атак
    triggerAttack(tentacleIds) {
        this.attackQueue = tentacleIds;
        this.changeState('PREP_ATTACK');
    }

    startAttackSequence(type) {
        if (type === 'WHIP') {
            this.triggerAttack([0, 1, 5, 6]); 
            this.changeState('STRIKING');
        } else {
            this.triggerAttack([2, 3, 4]); 
            this.changeState('WRAPPING');
        }
    }

    // === СИСТЕМА ДИНАМИЧЕСКИХ ХИТБОКСОВ ДЛЯ ХОЖДЕНИЯ ===
    getAllHitboxes() {
        const hitboxes = [];
        const matrix = {
            m: [1, 0, 0, 1, 0, 0],
            stack: [],
            save() { this.stack.push([...this.m]); },
            restore() { if (this.stack.length > 0) this.m = this.stack.pop(); },
            translate(x, y) {
                this.m[4] += this.m[0] * x + this.m[2] * y;
                this.m[5] += this.m[1] * x + this.m[3] * y;
            },
            scale(sx, sy) {
                this.m[0] *= sx; this.m[1] *= sx;
                this.m[2] *= sy; this.m[3] *= sy;
            },
            rotate(rad) {
                const c = Math.cos(rad), s = Math.sin(rad);
                const m0 = this.m[0], m1 = this.m[1], m2 = this.m[2], m3 = this.m[3];
                this.m[0] = m0 * c + m2 * s;
                this.m[1] = m1 * c + m3 * s;
                this.m[2] = m0 * -s + m2 * c;
                this.m[3] = m1 * -s + m3 * c;
            },
            transformPoint(x, y) {
                return {
                    x: this.m[0] * x + this.m[2] * y + this.m[4],
                    y: this.m[1] * x + this.m[3] * y + this.m[5]
                };
            }
        };

        const jellyCycle = (this.time * this.swimSpeed) % (Math.PI * 2);
        let jellyThrustY = (jellyCycle < Math.PI) ? Math.pow(Math.sin(jellyCycle), 2) * -20 : -20 + Math.sin(((jellyCycle - Math.PI) / Math.PI) * Math.PI / 2) * 20;
        let jellyScaleY = 1 + Math.sin(jellyCycle) * 0.08;
        let jellyScaleX = 1 - Math.sin(jellyCycle) * 0.04;

        matrix.translate(this.x, this.y + Math.sin(this.time * 0.5) * 15 + jellyThrustY);
        matrix.scale(this.flipX * jellyScaleX, jellyScaleY);

        this.tentacles.forEach((t) => {
            matrix.save();
            matrix.translate(t.ox, t.oy);
            const sideSign = t.ox < 0 ? -1 : 1;
            const idleWave = Math.sin(this.time * t.speed + t.phase * sideSign) * t.swing;
            matrix.rotate(t.currentAngle + idleWave);

            this.parts.forEach((part, index) => {
                const progress = index / (this.parts.length - 1);
                const whipEffect = Math.sin(this.time * 4.0 - index * 0.4) * t.tension * 0.4;
                const baseWave = Math.sin(this.time * t.speed - index * 0.25 + t.phase) * t.swing * this.wiggleIntensity;
                const curl = t.wrapAmount * Math.pow(progress, 3);

                matrix.rotate(baseWave + whipEffect + curl);

                let stretch = 1 + (t.tension * 0.05 * progress);
                let segHeight = part.h * part.sy * stretch;
                let worldPos = matrix.transformPoint(0, segHeight / 2);
                let currentRadius = (part.w * part.sx * 0.45) * Math.abs(jellyScaleX);

                hitboxes.push({ x: worldPos.x, y: worldPos.y, radius: currentRadius });
                matrix.translate(0, segHeight * 0.86);
            });
            matrix.restore();
        });

        return hitboxes; 
    }

    // РЕНДЕРИНГ
    draw(ctx, assets) {
       if (this.alpha <= 0) return; 
        ctx.save();
        ctx.globalAlpha = this.alpha; 
        
        const jellyCycle = (this.time * this.swimSpeed) % (Math.PI * 2);
        let jellyThrustY = (jellyCycle < Math.PI) ? Math.pow(Math.sin(jellyCycle), 2) * -20 : -20 + Math.sin(((jellyCycle - Math.PI) / Math.PI) * Math.PI / 2) * 20;
        let jellyScaleY = 1 + Math.sin(jellyCycle) * 0.08;
        let jellyScaleX = 1 - Math.sin(jellyCycle) * 0.04;

        ctx.translate(this.x, this.y + Math.sin(this.time * 0.5) * 15 + jellyThrustY);
        ctx.scale(this.flipX * jellyScaleX, jellyScaleY);

        const sortedTentacles = [...this.tentacles].sort((a, b) => (a.isMain ? 1 : b.isMain ? -1 : a.id - b.id));

        sortedTentacles.forEach((t) => {
            ctx.save();
            ctx.translate(t.ox, t.oy);
            const sideSign = t.ox < 0 ? -1 : 1;
            const idleWave = Math.sin(this.time * t.speed + t.phase * sideSign) * t.swing;
            ctx.rotate(t.currentAngle + idleWave);

            this.parts.forEach((part, index) => {
                const img = assets[part.name];
                if (!img) return;

                const progress = index / (this.parts.length - 1); 
                const whipEffect = Math.sin(this.time * 4.0 - index * 0.4) * t.tension * 0.4;
                const baseWave = Math.sin(this.time * t.speed - index * 0.25 + t.phase) * t.swing * this.wiggleIntensity;
                const curl = t.wrapAmount * Math.pow(progress, 3);

                ctx.rotate(baseWave + whipEffect + curl);
                ctx.save();
                
                let stretch = 1 + (t.tension * 0.05 * progress);
                ctx.scale(part.sx, part.sy * stretch);
                ctx.drawImage(img, -part.w / 2, 0, part.w, part.h + 12);
                ctx.restore();

                ctx.translate(0, (part.h * part.sy * stretch) * 0.86);
            });
            ctx.restore();
        });

        if (assets.kraken_head) {
            ctx.save();
            ctx.drawImage(assets.kraken_head, -210, -130, 420, 460);
            ctx.restore();
        }

        ctx.restore();
    }
}