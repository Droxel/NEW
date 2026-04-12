import { world } from "../../world/World.js";
import { bossManager } from "../../entities/bosses/BossManager.js";
import { lightingManager } from "../../world/LightingManager.js";
import { cameraX, cameraY } from "../Braw.js";

export function setupKeyboard(player, state) {
    document.addEventListener("keydown", e => {
        // Движение
        if (e.code === "KeyA") state.moveLeft = true;
        if (e.code === "KeyD") state.moveRight = true;
        if (e.code === "KeyW" || e.code === "ArrowUp") state.moveUp = true;
        if (e.code === "KeyS" || e.code === "ArrowDown") state.moveDown = true;

        // Прыжок
        if (e.code === "Space") {
            state.jumpPressed = true;
            player.jump();
            
            // Отпускание крюка пробелом
            if (player.hook && player.hook.active) {
                player.hook.release();
            }
        }

        // Полет (F)
        if (e.code === "KeyF") {
            player.isFlying = !player.isFlying;
            player.velocityY = 0;
        }

        // Свет (L)
        if (e.code === "KeyL") {
            lightingManager.isEnabled = !lightingManager.isEnabled;
        }

        // Лечение (R)
        if (e.code === "KeyR") {
            if (typeof player.eatPotion === 'function') player.eatPotion();
            else if (typeof player.usePotion === 'function') player.usePotion();
        }

        // Взаимодействие (E) - объединили логику из main.js и старого Input.js
        if (e.code === "KeyE") {
            handleInteractionKey(player);
        }

        // Выстрел крюком (G)
        if (e.code === "KeyG") {
            if (player.hasHookInInventory) {
                const playerCenterX = player.x + player.size / 2;
                const playerCenterY = player.y + player.size / 2;
                const worldMouseX = state.mouseX + cameraX;
                const worldMouseY = state.mouseY + cameraY;

                const angle = Math.atan2(worldMouseY - playerCenterY, worldMouseX - playerCenterX);
                console.log("🚀 Выстрел крюком по углу:", angle);
                player.hook.shoot(angle); 
            } else {
                console.log("⚠️ Крюка нет в инвентаре!");
            }
        }

        // Телепорт для дебага (T)
        if (e.code === 'KeyT') {
            player.x = -104228; 
            player.y = world.getHeight(player.x, true) - 200; 
            player.velocityX = player.velocityY = 0;
        }
    });

    document.addEventListener("keyup", e => {
        if (e.code === "KeyA") state.moveLeft = false;
        if (e.code === "KeyD") state.moveRight = false;
        if (e.code === "KeyW" || e.code === "ArrowUp") state.moveUp = false;
        if (e.code === "KeyS" || e.code === "ArrowDown") state.moveDown = false;
        if (e.code === "Space") state.jumpPressed = false; 
    });
}

function handleInteractionKey(player) {
    const currentChunkId = world.chunkManager.getChunkId(player.x);
    const chunk = world.chunkManager.chunks.get(currentChunkId);
    
    if (!chunk) return;

    // Проверка сундуков
    for (let obj of chunk.objects) {
        if (obj.type === "chest" && obj.instance) {
            const chest = obj.instance;
            const dx = (player.x + player.size / 2) - (chest.x + chest.width / 2);
            const dy = player.y - chest.y;
            // Проверяем дистанцию (используем чуть больший радиус из main.js)
            if (Math.sqrt(dx * dx + dy * dy) < 60 || Math.abs(player.x - (chest.x + chest.width/2)) < 50) {
                chest.interact();
                return; // Выходим, если открыли сундук
            }
        }
    }

    // Проверка статуй
    if (chunk.statues) {
        chunk.statues.forEach(statue => {
            statue.interact(player, bossManager);
        });
    }
}