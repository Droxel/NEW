// KrakenAttack.js

// Проверка коллизий и физическое взаимодействие с кораблем
export function checkShipInteraction(kraken, ship, dt) {
    if (ship.isBroken) return;

    const hitboxes = kraken.getAllHitboxes();
    let isTouching = false;
    ship.isBeingCrushed = (kraken.state === 'WRAPPING');

    hitboxes.forEach(hb => {
        // Простая проверка коллизии (круг - прямоугольник)
        if (hb.x > ship.x && hb.x < ship.x + ship.width &&
            hb.y > ship.y && hb.y < ship.y + ship.height) {
            
            isTouching = true;
            
            // Вычисляем сторону удара: -1 если слева, 1 если справа
            const side = hb.x < (ship.x + ship.width / 2) ? 1 : -1;

            if (kraken.state === 'ATTACK_WHIP' && !kraken.hasHitThisAttack) {
                // Удар хлыстом: большая сила (25) гарантирует отвал деталей
                ship.applyKrakenHit(25, side); 
                kraken.hasHitThisAttack = true;
            } else if (kraken.state === 'WRAPPING') {
                // Мертвая хватка: начинаем ломать и топить
                ship.isBeingCrushed = true;
                
                // Каждую секунду в хватке отрываем деталь, если еще остались
                kraken.crushTimer = (kraken.crushTimer || 0) + dt;
                if (kraken.crushTimer > 1.0) {
                    ship.detachPart();
                    kraken.crushTimer = 0;
                }
            }

            if (kraken.state === 'ATTACK_WHIP' && !kraken.hasHitThisAttack) {
                // Хлыст отбрасывает корабль и отрывает кусок
                ship.applyKrakenHit(20, side); 
                kraken.hasHitThisAttack = true;
                
                if (typeof audioManager !== 'undefined') {
                    audioManager.playSFX('world/ship/heavy_impact.wav', 1.0);
                }
            } else if (kraken.state === 'WRAPPING') {
                // В хватке корабль медленно кренится под весом щупалец
                ship.wobbleVelocity += side * 2.0 * dt;
                ship.liftY = Math.max(ship.liftY, 40); 
            } else {
                // Обычное скольжение по щупальцам (подъем)
                const overlapY = (ship.y + ship.height) - hb.y;
                if (overlapY > 0) {
                    ship.liftY = Math.max(ship.liftY, overlapY);
                    ship.wobbleVelocity += side * 5.0 * dt;
                }
            }
        }
    });

    if (!isTouching) {
        ship.liftY = kraken.lerp(ship.liftY, 0, dt * 2);
    }
}

// Обновление состояний стейт-машины
export function updateKrakenLogic(kraken, dt, targetShip) {
    kraken.time += dt;
    kraken.stateTimer += dt;
    
    // Вызываем интеракцию с кораблем
    checkShipInteraction(kraken, targetShip, dt);

    const shipCenterX = targetShip.x + targetShip.width / 2;
    const stopDepth = targetShip.y + 350; 

    switch (kraken.state) {
        case 'RISING':
            if (kraken.y > stopDepth) {
                kraken.y -= 40 * dt; 
            } else {
                kraken.y = stopDepth;
                kraken.changeState('IDLE_UNDER');
            }
            break;

        case 'IDLE_UNDER':
            kraken.tentacles.forEach((t, i) => {
                t.targetAngle = t.defaultAngle + Math.sin(kraken.time * 0.8 + i) * 0.3;
                t.targetTension = 0.2;
                t.targetWrap = Math.sin(kraken.time * 2 + i) * 1.5; 
            });
            if (kraken.stateTimer > 2.0) selectNextAction(kraken);
            break;

        case 'ATTACK_MISS':
            if (kraken.targetTentacle) {
                const offset = kraken.targetTentacle.ox < 0 ? -120 : 120; 
                kraken.targetTentacle.targetAngle = -0.2; 
                kraken.targetTentacle.targetTension = 1.2;
                
                if (kraken.stateTimer > 0.8) { 
                    kraken.targetTentacle.targetAngle = kraken.targetTentacle.defaultAngle;
                    kraken.targetTentacle.targetTension = 0;
                    if (kraken.stateTimer > 1.5) kraken.changeState('IDLE_UNDER');
                }
            }
            break;

        case 'ATTACK_WHIP':
            if (kraken.targetTentacle) {
                if (kraken.stateTimer < 0.5) {
                    kraken.targetTentacle.targetAngle = kraken.targetTentacle.defaultAngle + 0.5;
                } else {
                    const angleToShip = Math.atan2(targetShip.y - (kraken.y + kraken.targetTentacle.oy), shipCenterX - (kraken.x + kraken.targetTentacle.ox)) - Math.PI/2;
                    kraken.targetTentacle.targetAngle = angleToShip;
                    kraken.targetTentacle.targetTension = 2.5; 
                }

                if (kraken.stateTimer > 1.2) {
                    kraken.targetTentacle.targetTension = 0;
                    kraken.changeState('IDLE_UNDER');
                }
            }
            break;

        case 'WRAPPING':
            kraken.attackQueue.forEach(id => {
                let t = kraken.tentacles.find(x => x.id === id);
                if (t) {
                    const angleToShip = Math.atan2(targetShip.y - (kraken.y + t.oy), shipCenterX - (kraken.x + t.ox)) - Math.PI/2;
                    t.targetAngle = angleToShip;
                    t.targetWrap = (t.ox < 0) ? 15 : -15; 
                    t.targetTension = 1.8;
                }
            });

            if (kraken.stateTimer > 2.0) {
                kraken.y += 45 * dt; 
                targetShip.y += 45 * dt;
            } else {
                targetShip.wobbleVelocity += (Math.random() - 0.5) * 6.0 * dt;
            }

            if (targetShip.parts.length === 0 || kraken.stateTimer > 6.0) {
                targetShip.isBroken = true; 
                kraken.changeState('LEAVING');
            }
            break;

        case 'LEAVING':
            kraken.tentacles.forEach(t => {
                t.targetAngle = Math.PI; 
                t.targetWrap = 0;        
                t.targetTension = 0;     
            });

            kraken.y += 150 * dt; 
            
            if (kraken.stateTimer > 1.5) {
                kraken.alpha -= dt * 0.8; 
            }

            if (kraken.alpha <= 0) {
                kraken.alpha = 0;
                kraken.isDead = true; 
            }
            break;
    }

    // Физика плавного сглаживания движения (Lerp)
    kraken.tentacles.forEach(t => {
        let speed = (kraken.state === 'ATTACK_WHIP') ? 12 : 3;
        t.currentAngle = kraken.lerpAngle(t.currentAngle, t.targetAngle, dt * speed);
        t.wrapAmount = kraken.lerp(t.wrapAmount, t.targetWrap, dt * 2);
        t.tension = kraken.lerp(t.tension, t.targetTension, dt * 4);
    });
}

// Выбор следующего действия ИИ Кракена
export function selectNextAction(kraken) {
    kraken.stateTimer = 0;
    
    if (kraken.attackPhase === 0) { 
        kraken.targetTentacle = kraken.tentacles[Math.floor(Math.random() * kraken.tentacles.length)];
        kraken.changeState('ATTACK_MISS');
        kraken.missCount++;
        if (kraken.missCount >= 4) { kraken.attackPhase = 1; kraken.missCount = 0; }
    } 
    else if (kraken.attackPhase === 1) { 
        kraken.targetTentacle = kraken.tentacles[Math.floor(Math.random() * 3) + 2]; 
        kraken.changeState('ATTACK_WHIP');
        kraken.missCount++; 
        if (kraken.missCount >= 3) { kraken.attackPhase = 2; }
    }
    else if (kraken.attackPhase === 2) { 
        kraken.attackQueue = [0, 1, 3, 5, 6]; 
        kraken.changeState('WRAPPING');
    }
}