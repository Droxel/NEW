// Файл: src/entities/bosses/ocean_boss/OceanBossKraken.js

export class OceanBossKraken {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.time = 0;
        
        // Физика пружины для сочного, упругого разворота
        this.currentFlipX = 1;
        this.targetFlipX = 1;
        this.flipVelocity = 0; // Скорость изменения флипа
        this.springStiffness = 190; // Жесткость пружины (выше = резче переход)
        this.springDamping = 12;    // Затухание (ниже = больше пружинит)
        
        this.alpha = 0; 
        this.state = 'spawning'; // 'spawning', 'active', 'leaving'
        this.attackCooldown = 3;
        this.lastTentacleId = -1;

        // Бионика
        this.wiggleIntensity = 1.0;
        this.swimSpeed = 0.8; // Тяжелый вес

        // Конфигурация анатомии с небрежным, широким распределением углов во все стороны
        this.tentacles = [
            { id: 0, group: 'A', defaultAngle: Math.PI * 1.15, ox: -170, oy: 40,  phase: 0.0, speed: 0.35, swing: 0.18 },
            { id: 1, group: 'A', defaultAngle: Math.PI * 0.85, ox: -110, oy: 90,  phase: 3.14, speed: 0.4,  swing: 0.15 },
            { id: 2, group: 'B', defaultAngle: Math.PI * 0.65, ox: -50,  oy: 120, phase: 1.0,  speed: 0.8,  swing: 0.12 },
            { id: 3, group: 'B', defaultAngle: Math.PI * 0.50, ox: 0,    oy: 140, phase: 2.5,  speed: 0.9,  swing: 0.12, isMain: true },
            { id: 4, group: 'C', defaultAngle: Math.PI * 0.35, ox: 50,   oy: 120, phase: 0.8,  speed: 0.2,  swing: 0.05 },
            { id: 5, group: 'C', defaultAngle: Math.PI * 0.15, ox: 100,  oy: 90,  phase: 2.2,  speed: 0.2,  swing: 0.05 },
            { id: 6, group: 'A', defaultAngle: Math.PI * -0.15,ox: 170,  oy: 40,  phase: 0.5,  speed: 0.35, swing: 0.18 },
            { id: 7, group: 'A', defaultAngle: Math.PI * 0.50, ox: -20,  oy: 50,  phase: 1.7,  speed: 0.5,  swing: 0.14 }
        ].map(t => ({
            ...t,
            currentAngle: t.defaultAngle, 
            targetAngle: t.defaultAngle,  
            wrapAmount: 0,   
            targetWrap: 0,
            tension: 0,      
            targetTension: 0,
            isAttacking: false,
            attackPhase: 0,
            interpSpeed: 2.0, 
            strikeTargetX: 0,
            strikeTargetY: 0,
            hasStruck: false
        }));

        // Сегменты скелета щупальца
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

    update(dt, player) {
        this.time += dt;

        // Физика пружины для разворота (Spring Physics)
        const springForce = (this.targetFlipX - this.currentFlipX) * this.springStiffness;
        this.flipVelocity += springForce * dt;
        this.flipVelocity -= this.flipVelocity * this.springDamping * dt;
        this.currentFlipX += this.flipVelocity * dt;

        if (this.state === 'spawning') {
            this.alpha += dt * 0.5;
            this.y -= 150 * dt; 
            if (this.alpha >= 1) {
                this.alpha = 1;
                this.state = 'active';
            }
        } else if (this.state === 'leaving') {
            // Плавное, величественное погружение на дно с затуханием
            this.alpha -= dt * 0.4; // Чуть медленнее исчезает для кинематографичности
            this.y += 220 * dt;    // Уходит глубоко вниз
            
            // Расслабляем все щупальца, пусть уплывают вверх от гидродинамического сопротивления
            this.tentacles.forEach(t => {
                t.interpSpeed = 1.0;
                t.targetAngle = Math.PI * 0.5; // Направлены вверх относительно падающего тела
                t.targetWrap = Math.sin(this.time * 2 + t.id) * 3.0;
                t.targetTension = 0;
                
                t.currentAngle += (t.targetAngle - t.currentAngle) * t.interpSpeed * dt;
                t.wrapAmount += (t.targetWrap - t.wrapAmount) * t.interpSpeed * dt;
            });

            if (this.alpha <= 0) {
                this.alpha = 0;
            }
            return;
        }

        if (this.state === 'active') {
            const targetX = player.x;
            const targetY = player.y - 150 + Math.cos(this.time * 0.5) * 30; 
            
            this.x += (targetX - this.x) * 0.2 * dt;
            this.y += (targetY - this.y) * 0.2 * dt;
            
            // Задаем цель для пружины разворота
            this.targetFlipX = player.x < this.x ? 1 : -1; 

            this.attackCooldown -= dt;
            if (this.attackCooldown <= 0) {
                this.startRandomAttack(player);
                this.attackCooldown = 2.0 + Math.random() * 2.0; 
            }
        }

        this.updateTentacles(dt, player);
    }

    // Возвращает массив светящихся точек для LightingManager, формируя силуэт
    getLightSources() {
        if (this.alpha <= 0 || this.state === 'leaving') return [];

        // Вычисляем точную Y-координату с учетом качания туши
        const jellyCycle = (this.time * this.swimSpeed) % (Math.PI * 2);
        let jellyThrustY = (jellyCycle < Math.PI) ? Math.pow(Math.sin(jellyCycle), 2) * -15 : -15 + Math.sin(((jellyCycle - Math.PI) / Math.PI) * Math.PI / 2) * 15;
        const renderY = this.y + Math.sin(this.time * 0.5) * 15 + jellyThrustY;
        
        // Разворот точек вслед за телом
        const flip = this.currentFlipX < 0 ? -1 : 1;

        // Создаем 3 пробивающихся световых отверстия на голове (например, светящиеся био-глаза/дыры)
        return [
            { x: this.x + (-45 * flip), y: renderY - 30, radius: 40, intensity: 0.9, isTorch: true },
            { x: this.x + (45 * flip),  y: renderY - 10, radius: 35, intensity: 0.9, isTorch: true },
            { x: this.x + (0 * flip),   y: renderY + 40, radius: 55, intensity: 0.85, isTorch: false }
        ];
    }

    // Расчет хитбоксов каждого сегмента для бега игрока (Forward Kinematics)
    getAllHitboxes() {
        const hitboxes = [];
        // Если босс еще не появился или уходит на дно — отключаем коллизии
        if (this.alpha < 0.3 || this.state === 'leaving') return hitboxes;

        const jellyCycle = (this.time * this.swimSpeed) % (Math.PI * 2);
        let jellyThrustY = (jellyCycle < Math.PI) ? Math.pow(Math.sin(jellyCycle), 2) * -15 : -15 + Math.sin(((jellyCycle - Math.PI) / Math.PI) * Math.PI / 2) * 15;
        const renderY = this.y + Math.sin(this.time * 0.5) * 15 + jellyThrustY;

        this.tentacles.forEach(t => {
            // Начальная точка крепления щупальца к телу (учитываем текущий коэффициент сжатия/разворота)
            let currentX = this.x + t.ox * this.currentFlipX;
            let currentY = renderY + t.oy;

            const sideSign = t.ox < 0 ? -1 : 1;
            const idleWave = Math.sin(this.time * t.speed + t.phase * sideSign) * t.swing;
            
            // Мировое направление первого сустава
            let currentGlobalAngle = (t.currentAngle + idleWave) * this.currentFlipX;

            this.parts.forEach((part, index) => {
                const progress = index / (this.parts.length - 1);
                const hydroDragOffset = index * 0.35;
                
                let whipEffect = 0;
                if (t.tension > 0) {
                    const freq = t.isAttacking ? 15.0 : 4.0;
                    whipEffect = Math.sin(this.time * freq - hydroDragOffset) * t.tension * 0.08 * progress;
                }

                const curl = t.wrapAmount * Math.pow(progress, 2.5);
                
                // Накапливаем угол изгиба сегмента
                currentGlobalAngle += (whipEffect + curl) * this.currentFlipX;
                
                let stretch = 1 + (t.tension * 0.03 * progress);
                let segmentLength = (part.h * part.sy * stretch) * 0.86;
                
                // Находим центр текущей кости
                const midX = currentX + Math.cos(currentGlobalAngle + Math.PI / 2) * (segmentLength * 0.5);
                const midY = currentY + Math.sin(currentGlobalAngle + Math.PI / 2) * (segmentLength * 0.5);
                
                // Добавляем круглый хитбокс (радиус масштабируется от ширины куска)
                hitboxes.push({
                    x: midX,
                    y: midY,
                    radius: (part.w * part.sx) * 0.38 // Оптимальный коэффициент толщины хитбокса
                });
                
                // Переходим к следующему суставу цепочки
                currentX += Math.cos(currentGlobalAngle + Math.PI / 2) * segmentLength;
                currentY += Math.sin(currentGlobalAngle + Math.PI / 2) * segmentLength;
            });
        });

        return hitboxes;
    }

    startRandomAttack(player) {
        const available = this.tentacles.filter(t => (t.group === 'B' || t.group === 'C') && !t.isAttacking);
        if (available.length === 0) return;

        let tId;
        do { 
            tId = available[Math.floor(Math.random() * available.length)].id; 
        } while (tId === this.lastTentacleId && available.length > 1);
        
        this.lastTentacleId = tId;
        const tentacle = this.tentacles[tId];
        
        tentacle.isAttacking = true;
        tentacle.attackPhase = 0;
        tentacle.hasStruck = false;
        
        tentacle.strikeTargetX = player.x;
        tentacle.strikeTargetY = player.y;
    }

    updateTentacles(dt, player) {
        const isAnyAttacking = this.tentacles.some(t => t.isAttacking);
        const globalIdleMult = isAnyAttacking ? 0.5 : 1.0;

        this.tentacles.forEach(t => {
            if (t.isAttacking) {
                t.attackPhase += dt;

                if (t.attackPhase < 2.5) {
                    if (t.attackPhase < 2.2) {
                        t.strikeTargetX = player.x;
                        t.strikeTargetY = player.y;
                    }
                    t.interpSpeed = 1.0; 
                    t.targetWrap = -4.5; 
                    t.targetTension = 3.0; 
                    t.targetAngle = t.defaultAngle - Math.PI/2 * (t.ox < 0 ? -1 : 1);

                } else if (t.attackPhase < 2.7) {
                    const flipScale = this.currentFlipX !== 0 ? this.currentFlipX : 1;
                    const localTargetX = (t.strikeTargetX - this.x) / flipScale;
                    const localTargetY = t.strikeTargetY - this.y;
                    
                    const angleToPlayer = Math.atan2(localTargetY - t.oy, localTargetX - t.ox);
                    
                    t.interpSpeed = 25.0; 
                    t.targetAngle = angleToPlayer - (t.ox < 0 ? Math.PI : 0); 
                    t.targetWrap = -0.5; 
                    t.targetTension = 10.0; 
                    
                    if (!t.hasStruck) {
                        this.checkCollision(player, t);
                        t.hasStruck = true;
                    }
                } else if (t.attackPhase < 5.7) {
                    if (t.attackPhase < 3.5) {
                        t.interpSpeed = 0; 
                        t.targetTension = 20.0; 
                    } else {
                        t.interpSpeed = 0.8; 
                        t.targetWrap = 0;
                        t.targetAngle = t.defaultAngle;
                        t.targetTension = 0;
                    }
                } else {
                    t.isAttacking = false;
                }
            } else {
                // РЕЖИМ ПОКОЯ
                t.interpSpeed = 2.0;
                
                if (t.group === 'A') {
                    const wave = Math.sin(this.time * t.speed * globalIdleMult + t.phase);
                    t.targetWrap = wave * 2.0; 
                    t.targetAngle = t.defaultAngle + wave * 0.2;
                    t.targetTension = 0;
                } 
                else if (t.group === 'B') {
                    const flipScale = this.currentFlipX !== 0 ? this.currentFlipX : 1;
                    const localPlayerX = (player.x - this.x) / flipScale;
                    const localPlayerY = player.y - this.y;
                    
                    const angleToPlayer = Math.atan2(localPlayerY - t.oy, localPlayerX - t.ox);
                    const leanAngle = angleToPlayer - (t.ox < 0 ? Math.PI : 0);
                    
                    const pulse = Math.sin(this.time * 0.8 + t.phase);
                    
                    t.targetAngle = t.defaultAngle + (leanAngle - t.defaultAngle) * 0.3;
                    t.targetWrap = pulse > 0.8 ? -2 : pulse * 0.5;
                    t.targetTension = 1.5; 
                } 
                else if (t.group === 'C') {
                    t.targetWrap = 3.5; 
                    t.targetAngle = t.defaultAngle + Math.PI / 4; 
                    t.targetTension = 0.5;
                }
            }

            t.currentAngle += (t.targetAngle - t.currentAngle) * t.interpSpeed * dt;
            t.wrapAmount += (t.targetWrap - t.wrapAmount) * t.interpSpeed * dt;
            t.tension += (t.targetTension - t.tension) * t.interpSpeed * dt;
        });
    }

    checkCollision(player, tentacle) {
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < 800 && typeof player.takeDamage === 'function') {
            player.takeDamage(1);
        }
    }

    swimAway() {
        this.state = 'leaving';
    }

    draw(ctx, assets) {
        if (this.alpha <= 0) return; 
        ctx.save();
        ctx.globalAlpha = this.alpha; 
        
        const jellyCycle = (this.time * this.swimSpeed) % (Math.PI * 2);
        let jellyThrustY = (jellyCycle < Math.PI) ? Math.pow(Math.sin(jellyCycle), 2) * -15 : -15 + Math.sin(((jellyCycle - Math.PI) / Math.PI) * Math.PI / 2) * 15;
        let jellyScaleY = 1 + Math.sin(jellyCycle) * 0.05;
        let jellyScaleX = 1 - Math.sin(jellyCycle) * 0.03;

        ctx.translate(this.x, this.y + Math.sin(this.time * 0.5) * 15 + jellyThrustY);
        
        // Отрисовка использует физику сглаживания флипа!
        ctx.scale(this.currentFlipX * jellyScaleX, jellyScaleY);

        const sortedTentacles = [...this.tentacles].sort((a, b) => {
            const zOrder = { 'C': 0, 'A': 1, 'B': 2 };
            return zOrder[a.group] - zOrder[b.group];
        });

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
                const hydroDragOffset = index * 0.35; 
                
                let whipEffect = 0;
                if (t.tension > 0) {
                    const freq = t.isAttacking ? 15.0 : 4.0;
                    whipEffect = Math.sin(this.time * freq - hydroDragOffset) * t.tension * 0.08 * progress;
                }

                const curl = t.wrapAmount * Math.pow(progress, 2.5);

                ctx.rotate(whipEffect + curl);
                ctx.save();
                
                let stretch = 1 + (t.tension * 0.03 * progress);
                ctx.scale(part.sx, part.sy * stretch);
                
                if (t.group === 'C') {
                    ctx.filter = 'brightness(0.6)';
                }

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