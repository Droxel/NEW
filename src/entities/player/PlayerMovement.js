import { CONFIG } from "../../data/config.js";
import { world } from "../../world/World.js";
import { checkWallCollisions } from "./PlayerCollision.js";

export function handleJump(player) {
    const waterData = world.getWaterData(player.x, player.y); 
    const inWater = waterData.isWater; 
    
    // Если мы висим на крюке
    if (player.hook && player.hook.active && player.hook.hooked) {
        player.hook.release();
        player.velocityY = -CONFIG.jumpPower;
        player.onGround = false;
        return;
    }

    // Прыжок в воде (выпрыгивание/плавание)
    if (inWater) {
        player.velocityY = -4; 
        player.onGround = false;
        return;
    }

    // Обычный прыжок на земле
    if (player.onGround) {
        player.velocityY = -CONFIG.jumpPower;
        player.onGround = false;
        if (player.velocityX !== 0) {
            player.rotationDir = Math.sign(player.velocityX);
            player.rotationSpeed = 0.25;
        }
    }
}

export function updateMovement(player) {
    const waterData = world.getWaterData(player.x, player.y);
    const inWater = waterData.isWater; 

    player.isInWater = inWater; 

    // Физика воды
    if (inWater) {
        player.velocityX *= 0.5; 
        if (player.velocityY > 0) player.velocityY *= 0.9; 
    }

    // ДВИЖЕНИЕ
    if (player.hook && player.hook.active && player.hook.hooked) {
        // РЕЖИМ КРЮКА
        player.onGround = false;
        player.rotation = 0;
        if (Math.abs(player.velocityX) > 16) player.velocityX = 0; 
        if (Math.abs(player.velocityY) > 16) player.velocityY = 0;
    }
    else if (player.isFlying) {
        // РЕЖИМ ПОЛЕТА
        player.x += player.velocityX * 1.5; 
        player.y += player.velocityY * 1.5;
        player.onGround = false;
        player.rotation = 0; 
    } 
    else {
        // ОБЫЧНЫЙ РЕЖИМ (Гравитация)
        const MAX_FALL_SPEED = 25; 
        
        if (!inWater) {
            player.velocityY = Math.min(player.velocityY + CONFIG.gravity, MAX_FALL_SPEED);
        } else {
            // В воде гравитация слабее
            player.velocityY = Math.min(player.velocityY + CONFIG.gravity * 0.3, 4);
        }

        // Сохраняем позицию до движения
        const prevY = player.y;

        // Движение по X и коллизии
        player.x += player.velocityX;
        checkWallCollisions(player, 'x');

        // Движение по Y и коллизии
        player.y += player.velocityY;
        player.onGround = false; 
        checkWallCollisions(player, 'y');

        // Проверка поверхности земли
        const groundY = world.getHeight(player.x);
        const crossedGround = (prevY <= groundY && player.y >= groundY);
        const isInsideGround = (player.y > groundY && player.y - groundY < 200);

        if (player.velocityY >= 0 && (crossedGround || isInsideGround)) {
            if (!player.onGround) player.justLanded = true;
            player.y = groundY;
            player.velocityY = 0;
            player.onGround = true;
        }

        // ЗАЩИТА ОТ ВЫПАДЕНИЯ
        if (player.y > 35000) {
            console.warn("🆘 Игрок выпал за мир! Респавн на поверхность.");
            player.spawn(player.x); 
        }
    }
}