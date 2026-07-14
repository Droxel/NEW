//Keyboard.js
import { world } from "../../world/World.js";
import { bossManager } from "../../entities/bosses/BossManager.js";
import { lightingManager } from "../../world/LightingManager.js";
import { cameraX, cameraY } from "../Braw.js";
import { zoomIn, zoomOut } from "../../ui/components/ZoomUI.js";

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
        // Масштабирование (+ и -)
        if (e.key === "=" || e.key === "+" || e.code === "NumpadAdd") {
            zoomIn();
        }
        if (e.key === "-" || e.code === "NumpadSubtract") {
            zoomOut();
        } 
    });

    // Обработка Клика и Тапа по экрану для активации Статуи Атлантиды
    const handlePointerDown = (e) => {
        // Определяем экранные координаты в зависимости от типа события (мышь или тач)
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const canvas = document.querySelector("canvas");
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        // Получаем позицию клика относительно канваса
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;

        // Переводим в мировые координаты игры с учетом камеры
        const worldClickX = canvasX + cameraX;
        const worldClickY = canvasY + cameraY;

        const currentChunkId = world.chunkManager.getChunkId(player.x);
        const chunk = world.chunkManager.chunks.get(currentChunkId);
        
        if (!chunk || !chunk.objects) return;

        for (let obj of chunk.objects) {
            // Ищем объект статуи босса океана
            if (obj && typeof obj.interact === 'function') {
                // Проверяем, попал ли клик в границы текстуры статуи
                // Предполагаем стандартные размеры статуи, например ширина 96 и высота 128 (или подставьте свои значения obj.width/obj.height)
                const width = obj.width || 96;
                const height = obj.height || 128;

                // Так как drawY обычно считается от верха, а координаты объекта могут быть от центра или от левого верхнего угла:
                const insideX = worldClickX >= obj.x && worldClickX <= obj.x + width;
                const insideY = worldClickY >= obj.y && worldClickY <= obj.y + height;

                if (insideX && insideY) {
                    // Дополнительно проверяем расстояние от игрока до статуи (чтобы нельзя было активировать с другого конца карты)
                    const dx = (player.x + player.size / 2) - (obj.x + width / 2);
                    const dy = player.y - (obj.y + height / 2);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const radius = (obj.config && obj.config.interactionRadius) || 250;

                    if (distance <= radius) {
                        console.log("🗿 Статуя Атлантиды активирована по клику/тапу!");
                        obj.interact(player);
                        break;
                    }
                }
            }
        }
    };

    // Регистрируем на клик мыши и тап пальцем
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
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

// Проверка обычных статуй (твои старые статуи из биомов)
    if (chunk.statues) {
        chunk.statues.forEach(statue => {
            statue.interact(player, bossManager);
        });
    }

    // Проверка статуи Атлантиды (ищет её внутри chunk.objects)
    if (chunk.objects) {
        for (let obj of chunk.objects) {
            // Если у объекта есть метод interact и это экземпляр класса Statue
            if (obj && typeof obj.interact === 'function') {
                const dx = (player.x + player.size / 2) - obj.x;
                const dy = player.y - obj.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Берем радиус из конфига статуи (у тебя там 200)
                const radius = (obj.config && obj.config.interactionRadius) || 200;

                if (distance <= radius) {
                    console.log("🗿 Активация статуи Атлантиды!");
                    obj.interact(player); // Вызываем метод interact прямо у созданного класса
                    break;
                }
            }
        }
    }
}