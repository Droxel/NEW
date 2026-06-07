// Kraken.js
export class Kraken {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.time = 0;
        this.flipX = 1;

        // --- СТЕЙТ-МАШИНА КРАКЕНА ---
// Внутри constructor(x, y)
this.state = 'RISING'; 
this.stateTimer = 0;
this.alpha = 1.0; // Добавь эту строку
this.attackPhase = 0; // 0 - промахи, 1 - хлыст, 2 - подготовка к захвату, 3 - мертвая хватка
this.missCount = 0;
this.targetTentacle = null; // Текущая активная щупальца
        // --- БИОНИКА ---
        this.wiggleIntensity = 1.0;
        this.swimSpeed = 2.0; // Сделали чуть медленнее и тяжелее

        this.hasHitThisAttack = false;

        // Конфигурация щупалец (собранная тобой анатомия)
        // Добавлены параметры для управления состояниями конкретного щупальца
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
            currentAngle: 0, // Угол 0 смотрит строго вниз по иерархии отрисовки
            targetAngle: 0,  // При спавне целимся вниз
            wrapAmount: 4,         // Насколько сильно скручивается кончик
            targetWrap: 0,
            tension: 0,            // Напряжение (для эффекта хлыста от основания к кончику)
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
    // Плавное замедление (для тяжелых движений)
    easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

checkShipInteraction(ship, dt) {
    if (ship.isBroken) return;

    const hitboxes = this.getAllHitboxes();
    let isTouching = false;
    ship.isBeingCrushed = (this.state === 'WRAPPING');

    hitboxes.forEach(hb => {
        // Простая проверка коллизии (круг - прямоугольник)
        if (hb.x > ship.x && hb.x < ship.x + ship.width &&
            hb.y > ship.y && hb.y < ship.y + ship.height) {
            
            isTouching = true;
            
            // Вычисляем сторону удара: -1 если слева, 1 если справа
            const side = hb.x < (ship.x + ship.width / 2) ? 1 : -1;

            if (this.state === 'ATTACK_WHIP' && !this.hasHitThisAttack) {
    // Удар хлыстом: большая сила (25) гарантирует отвал деталей
    ship.applyKrakenHit(25, side); 
    this.hasHitThisAttack = true;
} else if (this.state === 'WRAPPING') {
    // Мертвая хватка: начинаем ломать и топить
    ship.isBeingCrushed = true;
    
    // Каждую секунду в хватке отрываем деталь, если еще остались
    this.crushTimer = (this.crushTimer || 0) + dt;
    if (this.crushTimer > 1.0) {
        ship.detachPart();
        this.crushTimer = 0;
    }
}
if (this.state === 'ATTACK_WHIP' && !this.hasHitThisAttack) {
    // Хлыст отбрасывает корабль и отрывает кусок (сила 20 > 12)
    ship.applyKrakenHit(20, side); 
    this.hasHitThisAttack = true; // Чтобы не било каждый кадр пока щупальце внутри
    
    // Можно добавить доп. эффект тряски экрана или звука именно здесь
    if (typeof audioManager !== 'undefined') {
        audioManager.playSFX('world/ship/heavy_impact.wav', 1.0);
    }
} else if (this.state === 'WRAPPING') {
                // В хватке корабль медленно кренится под весом щупалец
                ship.wobbleVelocity += side * 2.0 * dt;
                ship.liftY = Math.max(ship.liftY, 40); 
            } else {
                // Обычное скольжение по щупальцам (подъем)
                const overlapY = (ship.y + ship.height) - hb.y;
                if (overlapY > 0) {
                    ship.liftY = Math.max(ship.liftY, overlapY);
                    // Корабль наклоняется, "обтекая" щупальце
                    ship.wobbleVelocity += side * 5.0 * dt;
                }
            }
        }
    });

    if (!isTouching) {
        ship.liftY = this.lerp(ship.liftY, 0, dt * 2);
    }
}

update(dt, targetShip) {
    this.time += dt;
    this.stateTimer += dt;
    this.checkShipInteraction(targetShip, dt);

    const shipCenterX = targetShip.x + targetShip.width / 2;
    const stopDepth = targetShip.y + 350; // Глубина, на которой стоит туловище

switch (this.state) {
            case 'RISING':
                if (this.y > stopDepth) {
                    this.y -= 40 * dt; 
                } else {
                    this.y = stopDepth;
                    this.changeState('IDLE_UNDER');
                }
                break;

            case 'IDLE_UNDER':
                // ЭПИК: Щупальца медленно и жутко тянутся к кораблю и "ощупывают" днище
                this.tentacles.forEach((t, i) => {
                    t.targetAngle = t.defaultAngle + Math.sin(this.time * 0.8 + i) * 0.3;
                    t.targetTension = 0.2;
                    // Кончики слегка подергиваются, предвкушая захват
                    t.targetWrap = Math.sin(this.time * 2 + i) * 1.5; 
                });
                if (this.stateTimer > 2.0) this.selectNextAction(); // Даем 2 секунды на нагнетание ужаса
                break;

            case 'ATTACK_MISS':
                // ... (оставляешь как было) ...
                if (this.targetTentacle) {
                    const offset = this.targetTentacle.ox < 0 ? -120 : 120; 
                    this.targetTentacle.targetAngle = -0.2; 
                    this.targetTentacle.targetTension = 1.2;
                    
                    if (this.stateTimer > 0.8) { 
                        this.targetTentacle.targetAngle = this.targetTentacle.defaultAngle;
                        this.targetTentacle.targetTension = 0;
                        if (this.stateTimer > 1.5) this.changeState('IDLE_UNDER');
                    }
                }
                break;

            case 'ATTACK_WHIP':
                // ... (оставляешь как было) ...
                if (this.targetTentacle) {
                    if (this.stateTimer < 0.5) {
                        this.targetTentacle.targetAngle = this.targetTentacle.defaultAngle + 0.5;
                    } else {
                        const angleToShip = Math.atan2(targetShip.y - (this.y + this.targetTentacle.oy), shipCenterX - (this.x + this.targetTentacle.ox)) - Math.PI/2;
                        this.targetTentacle.targetAngle = angleToShip;
                        this.targetTentacle.targetTension = 2.5; 
                    }

                    if (this.stateTimer > 1.2) {
                        this.targetTentacle.targetTension = 0;
                        this.changeState('IDLE_UNDER');
                    }
                }
                break;

            case 'WRAPPING':
                // ЭПИК: МЕРТВАЯ ХВАТКА
                this.attackQueue.forEach(id => {
                    let t = this.tentacles.find(x => x.id === id);
                    if (t) {
                        const angleToShip = Math.atan2(targetShip.y - (this.y + t.oy), shipCenterX - (this.x + t.ox)) - Math.PI/2;
                        t.targetAngle = angleToShip;
                        // Скручиваем в плотный рулетик!
                        t.targetWrap = (t.ox < 0) ? 15 : -15; 
                        t.targetTension = 1.8;
                    }
                });

                // Первые 2 секунды он просто ломает корабль и держит его (нагоняет жути)
                if (this.stateTimer > 2.0) {
                    // А вот теперь тяжело и неотвратимо тянем на дно
                    this.y += 45 * dt; 
                    targetShip.y += 45 * dt;
                } else {
                    // Пока не тянем на дно, просто сильно трясем корабль
                    targetShip.wobbleVelocity += (Math.random() - 0.5) * 6.0 * dt;
                }

                // ЕСЛИ ПРОШЛО МНОГО ВРЕМЕНИ ИЛИ КОРАБЛЬ СЛОМАН
                if (targetShip.parts.length === 0 || this.stateTimer > 6.0) {
                    targetShip.isBroken = true; // САМОЕ ВАЖНОЕ: Говорим кораблю, что он мертв навсегда!
                    this.changeState('LEAVING');
                }
                break;

            case 'LEAVING':
                // ЭПИК: Расслабляем щупальца. Из-за сопротивления воды при погружении они задираются вверх.
                this.tentacles.forEach(t => {
                    t.targetAngle = Math.PI; // Щупальца тянутся вверх (расслаблены)
                    t.targetWrap = 0;        // Рулетик раскручивается
                    t.targetTension = 0;     // Напряжения нет
                });

                // Медленное, величественное погружение на дно (не 400, а 150)
                this.y += 150 * dt; 
                
                if (this.stateTimer > 1.5) {
                    this.alpha -= dt * 0.8; // Медленно растворяется в глубине
                }

                if (this.alpha <= 0) {
                    this.alpha = 0;
                    this.isDead = true; 
                }
                break;
        }

    // Физика Lerp (оставляем без изменений)
    this.tentacles.forEach(t => {
        let speed = (this.state === 'ATTACK_WHIP') ? 12 : 3;
        t.currentAngle = this.lerpAngle(t.currentAngle, t.targetAngle, dt * speed);
        t.wrapAmount = this.lerp(t.wrapAmount, t.targetWrap, dt * 2);
        t.tension = this.lerp(t.tension, t.targetTension, dt * 4);
    });
}
selectNextAction() {
    this.stateTimer = 0;
    
    if (this.attackPhase === 0) { // ФАЗА ПРОМАХОВ
        this.targetTentacle = this.tentacles[Math.floor(Math.random() * this.tentacles.length)];
        this.changeState('ATTACK_MISS');
        this.missCount++;
        if (this.missCount >= 4) { this.attackPhase = 1; this.missCount = 0; }
    } 
    else if (this.attackPhase === 1) { // ФАЗА УДАРОВ ХЛЫСТОМ
        this.targetTentacle = this.tentacles[Math.floor(Math.random() * 3) + 2]; 
        this.changeState('ATTACK_WHIP');
        this.missCount++; // используем как счетчик ударов
        if (this.missCount >= 3) { this.attackPhase = 2; }
    }
    else if (this.attackPhase === 2) { // ФИНАЛЬНЫЙ ЗАХВАТ
        this.attackQueue = [0, 1, 3, 5, 6]; // Почти все щупальца хватают
        this.changeState('WRAPPING');
    }
}
// Новый метод для запуска разных серий атак
startAttackSequence(type) {
    if (type === 'WHIP') {
        this.triggerAttack([0, 1, 5, 6]); // Бьем боковыми
        this.changeState('STRIKING');
    } else {
        this.triggerAttack([2, 3, 4]); // Центральные идут на захват
        this.changeState('WRAPPING');
    }
}

    changeState(newState) {
        this.state = newState;
        this.stateTimer = 0;
        this.hasHitThisAttack = false; // <--- Добавь это
        console.log(`Кракен перешел в фазу: ${newState}`);
    }

    // Внешний вызов для старта серии атак
    triggerAttack(tentacleIds) {
        this.attackQueue = tentacleIds;
        this.changeState('PREP_ATTACK');
    }

// === СИСТЕМА ДИНАМИЧЕСКИХ ХИТБОКСОВ ДЛЯ ХОЖДЕНИЯ ===
    getAllHitboxes() {
        const hitboxes = [];

        // Виртуальный трекер матричных трансформаций (копия логики Canvas)
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

        // Базовые смещения тела Кракена (полное повторение из draw)
        const jellyCycle = (this.time * this.swimSpeed) % (Math.PI * 2);
        let jellyThrustY = (jellyCycle < Math.PI) ? Math.pow(Math.sin(jellyCycle), 2) * -20 : -20 + Math.sin(((jellyCycle - Math.PI) / Math.PI) * Math.PI / 2) * 20;
        let jellyScaleY = 1 + Math.sin(jellyCycle) * 0.08;
        let jellyScaleX = 1 - Math.sin(jellyCycle) * 0.04;

        matrix.translate(this.x, this.y + Math.sin(this.time * 0.5) * 15 + jellyThrustY);
        matrix.scale(this.flipX * jellyScaleX, jellyScaleY);

        // Просчитываем позицию каждого сустава каждого щупальца
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

                // Генерируем хитбокс в центре текущего сегмента
                let worldPos = matrix.transformPoint(0, segHeight / 2);
                
                // Радиус зависит от ширины спрайта и текущего сжатия/растяжения
                let currentRadius = (part.w * part.sx * 0.45) * Math.abs(jellyScaleX);

                hitboxes.push({
                    x: worldPos.x,
                    y: worldPos.y,
                    radius: currentRadius
                });

                // Сдвиг к следующему суставу
                matrix.translate(0, segHeight * 0.86);
            });

            matrix.restore(); // Возвращаем матрицу в исходное состояние для следующего щупальца
        });

        return hitboxes; // Обязательно возвращаем собранный массив!
    }

    draw(ctx, assets) {
       if (this.alpha <= 0) return; // Не рисуем, если исчез
        ctx.save();
        ctx.globalAlpha = this.alpha; // Устанавливаем прозрачность для всего Кракена
        // Плавная пульсация медузы
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
            
            // Базовый поворот корня щупальца
            ctx.rotate(t.currentAngle + idleWave);

            this.parts.forEach((part, index) => {
                const img = assets[part.name];
                if (!img) return;

                // --- ЛОГИКА ХЛЫСТА И СКРУЧИВАНИЯ ---
                const progress = index / (this.parts.length - 1); // 0.0 у корня, 1.0 у кончика
                
                // 1. Инерция хлыста (зависит от tension). Корень движется первым, кончик запаздывает.
                const whipEffect = Math.sin(this.time * 4.0 - index * 0.4) * t.tension * 0.4;
                
                // 2. Био-волна плавания
                const baseWave = Math.sin(this.time * t.speed - index * 0.25 + t.phase) * t.swing * this.wiggleIntensity;
                
                // 3. Скручивание кончика (wrap). Экспоненциально усиливается к концу (progress^3).
                const curl = t.wrapAmount * Math.pow(progress, 3);

                ctx.rotate(baseWave + whipEffect + curl);

                ctx.save();
                // Легкое растяжение при напряжении
                let stretch = 1 + (t.tension * 0.05 * progress);
                ctx.scale(part.sx, part.sy * stretch);
                ctx.drawImage(img, -part.w / 2, 0, part.w, part.h + 12);
                ctx.restore();

                // Сдвиг к следующему суставу
                ctx.translate(0, (part.h * part.sy * stretch) * 0.86);
            });
            ctx.restore();
        });

        // Отрисовка головы
        if (assets.kraken_head) {
            ctx.save();
            ctx.drawImage(assets.kraken_head, -210, -130, 420, 460);
            ctx.restore();
        }

        ctx.restore();
    }
}