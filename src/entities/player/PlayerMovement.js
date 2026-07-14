// PlayerMovement.js
import { CONFIG } from "../../data/config.js";
import { world } from "../../world/World.js";
import { checkWallCollisions } from "./PlayerCollision.js";

export function handleJump(player) {
    const waterData = world.getWaterData(player.x, player.y); 
    const inWater = waterData.isWater; 
    
    if (player.hook && player.hook.active && player.hook.hooked) {
        player.hook.release();
        player.velocityY = -CONFIG.jumpPower;
        player.onGround = false;
        return;
    }

if (inWater) {
        // Проверим, действует ли на игрока магия кристалла прямо сейчас
        let hasCrystalPower = false;
        let bestFactor = 0;
        const currentChunkIdx = Math.floor(player.x / (CONFIG.chunkSize || 1024));
        
        for (let c = currentChunkIdx - 1; c <= currentChunkIdx + 1; c++) {
            const chunk = world.chunkManager.getChunk(c * (CONFIG.chunkSize || 1024));
            if (chunk?.objects) {
                chunk.objects.forEach(obj => {
                    const crystal = obj.type === "cursed_crystal" ? obj : (obj.instance?.type === "cursed_crystal" ? obj.instance : null);
                    if (crystal && crystal.effectRadius) {
                        const dx = (player.x + player.size / 2) - (crystal.x + crystal.w / 2);
                        const dy = (player.y + player.size / 2) - (crystal.y + crystal.h / 2);
                        const dist = Math.hypot(dx, dy);
                        if (dist < crystal.effectRadius) {
                            hasCrystalPower = true;
                            const f = 1 - (dist / crystal.effectRadius);
                            if (f > bestFactor) bestFactor = f;
                        }
                    }
                });
            }
        }

        if (hasCrystalPower) {
            // Вместо вялого прыжка -4 даем мощный импульс вверх (чем ближе, тем сильнее к прыжку на суше)
            player.velocityY = -4 - (CONFIG.jumpPower - 4) * bestFactor;
        } else {
            player.velocityY = -4; 
        }
        player.onGround = false;
        return;
    }

    if (player.onGround) {
        player.velocityY = -CONFIG.jumpPower;
        player.onGround = false;
        if (player.velocityX !== 0) {
            player.rotationDir = Math.sign(player.velocityX);
            player.rotationSpeed = 0.25;
        }
    }
}

// Передаем kraken вторым аргументом
export function updateMovement(player, kraken) {
    const waterData = world.getWaterData(player.x, player.y);
    const inWater = waterData.isWater; 
    player.isInWater = inWater; 

    if (inWater) {
        player.velocityX *= 0.5; 
        if (player.velocityY > 0) player.velocityY *= 0.9; 
    }

    if (player.hook && player.hook.active && player.hook.hooked) {
        player.onGround = false;
        player.rotation = 0;
        if (Math.abs(player.velocityX) > 16) player.velocityX = 0; 
        if (Math.abs(player.velocityY) > 16) player.velocityY = 0;
    }
    else if (player.isFlying) {
        player.x += player.velocityX * 1.5; 
        player.y += player.velocityY * 1.5;
        player.onGround = false;
        player.rotation = 0; 
    } 
    else {
        const MAX_FALL_SPEED = 25; 
        
// Находим ближайший рабочий кристалл внутри загруженных чанков
        let closestCrystalDist = Infinity;
        let activeCrystal = null;

        const currentChunkIdx = Math.floor(player.x / (CONFIG.chunkSize || 1024));
        // Проверяем текущий, левый и правый чанки вокруг игрока
        for (let c = currentChunkIdx - 1; c <= currentChunkIdx + 1; c++) {
            const chunk = world.chunkManager.getChunk(c * (CONFIG.chunkSize || 1024));
            if (chunk && chunk.objects) {
                chunk.objects.forEach(obj => {
                    // Проверяем, инициализирован ли инстанс кристалла
                    const crystal = obj.type === "cursed_crystal" ? obj : (obj.instance?.type === "cursed_crystal" ? obj.instance : null);
                    if (crystal && crystal.effectRadius) {
                        const dx = (player.x + player.size / 2) - (crystal.x + crystal.w / 2);
                        const dy = (player.y + player.size / 2) - (crystal.y + crystal.h / 2);
                        const dist = Math.hypot(dx, dy);
                        
                        if (dist < crystal.effectRadius && dist < closestCrystalDist) {
                            closestCrystalDist = dist;
                            activeCrystal = crystal;
                        }
                    }
                });
            }
        }

        if (!inWater) {
            player.velocityY = Math.min(player.velocityY + CONFIG.gravity, MAX_FALL_SPEED);
        } else {
            if (activeCrystal) {
                // Коэффициент близости: 1.0 в упор, 0.0 на краю радиуса
                const effectFactor = 1 - (closestCrystalDist / activeCrystal.effectRadius);
                
                // Убираем вязкое торможение воды `player.velocityY *= 0.9`, которое выполнялось выше в updateMovement
                // Для этого компенсируем деление обратно, если скорость падения положительная
                if (player.velocityY > 0) {
                    player.velocityY /= 0.9; 
                }

                // Сила гравитации: вплотную к кристаллу возвращается полноценная воздушная гравитация
                const currentGravity = CONFIG.gravity * 0.3 + (CONFIG.gravity * 0.7 * effectFactor);
                // Ограничение скорости падения в воде плавно увеличиваем с водных "4" до полноценных "25"
                const currentMaxFall = 4 + (MAX_FALL_SPEED - 4) * effectFactor;

                player.velocityY = Math.min(player.velocityY + currentGravity, currentMaxFall);

                // Даем игроку нормально разогнаться по горизонтали (компенсируем деление на 0.5 из начала метода)
                player.velocityX /= 0.5; 
                // И даем дополнительное ускорение за счет силы кристалла
                player.velocityX *= (1 + effectFactor * 5.8); // Будет летать!
            } else {
                // Обычная физика воды, если кристалл далеко
                player.velocityY = Math.min(player.velocityY + CONFIG.gravity * 0.3, 4);
            }
        }
        const prevY = player.y;

        // Движение по оси X
        player.x += player.velocityX;
        checkWallCollisions(player, 'x');

        // Движение по оси Y
        player.y += player.velocityY;
        player.onGround = false; 
        checkWallCollisions(player, 'y');

// === ВЗАИМОДЕЙСТВИЕ С ЩУПАЛЬЦАМИ КРАКЕНА ===
if (kraken) {
    const playerRadius = 16; // Примерный радиус хитбокса игрока
    const playerHeight = 40; // Предполагаемая высота игрока

    const hitboxes = kraken.getAllHitboxes();

    hitboxes.forEach(hitbox => {
        // ИСПРАВЛЕНИЕ 1: Пересчитываем центр игрока НА КАЖДОМ шаге цикла.
        // Теперь мы учитываем сдвиг от предыдущего хитбокса этой же цепочки!
        const pCenterX = player.x;
        const pCenterY = player.y - playerHeight / 2; 

        const dx = pCenterX - hitbox.x;
        const dy = pCenterY - hitbox.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = playerRadius + hitbox.radius;

        if (distance < minDist) {
            const overlap = minDist - distance;
            
            // Вычисляем вектор выталкивания (нормаль)
            const nx = distance === 0 ? 0 : dx / distance;
            const ny = distance === 0 ? -1 : dy / distance;

            // Выталкиваем игрока из щупальца
            player.x += nx * overlap;
            player.y += ny * overlap;

            // ИСПРАВЛЕНИЕ 2: Смягчаем условие ny < 0.1.
            // Если ny отрицательный или слегка положительный — игрок находится на верхней
            // или боковой (наклонной) части окружности. Если он при этом падает (velocityY >= 0),
            // мы обязаны его приземлить и погасить скорость.
            if (ny < 0.1 && player.velocityY >= 0) {
                player.onGround = true;
                player.velocityY = 0;
            }
        }
    });
}
// ============================================
        const groundY = world.getHeight(player.x);
        const crossedGround = (prevY <= groundY && player.y >= groundY);
        const isInsideGround = (player.y > groundY && player.y - groundY < 200);

        if (player.velocityY >= 0 && (crossedGround || isInsideGround)) {
            if (!player.onGround) player.justLanded = true;
            player.y = groundY;
            player.velocityY = 0;
            player.onGround = true;
        }

        if (player.y > 35000) {
            player.spawn(player.x); 
        }
    }
}