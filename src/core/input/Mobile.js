//Mobile.js
import { world } from "../../world/World.js";
import { cameraX, cameraY } from "../Braw.js"; // Импортируем координаты камеры для перевода в мировые координаты

export function setupMobile(player, state) {
    const leftBtn  = document.getElementById("left");
    const rightBtn = document.getElementById("right");
    const jumpBtn  = document.getElementById("jump");

    if (leftBtn && rightBtn && jumpBtn) {
        leftBtn.addEventListener("touchstart", e => { e.preventDefault(); state.moveLeft = true; });
        leftBtn.addEventListener("touchend", () => { state.moveLeft = false; });
        
        rightBtn.addEventListener("touchstart", e => { e.preventDefault(); state.moveRight = true; });
        rightBtn.addEventListener("touchend", () => { state.moveRight = false; });
        
        jumpBtn.addEventListener("touchstart", e => { 
            e.preventDefault(); 
            state.jumpPressed = true; 
            player.jump(); 
        });
        jumpBtn.addEventListener("touchend", () => { 
            state.jumpPressed = false; 
        });
    }

    // Джойстик крюка
    const hookJoy = document.getElementById("hook-joystick-container");
    const hookKnob = document.getElementById("hook-joystick-stick");

    if (hookJoy && hookKnob) {
        let joyActive = false;
        let startX = 0, startY = 0;
        let vecX = 0, vecY = 0;

        hookJoy.addEventListener("touchstart", e => {
            e.preventDefault();
            joyActive = true;
            const rect = hookJoy.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
            hookKnob.style.transition = 'none';
        }, { passive: false });

        window.addEventListener("touchmove", e => {
            if (!joyActive) return;
            const touch = Array.from(e.touches).find(t => t.target === hookJoy || joyActive);
            if (!touch) return;

            let dx = touch.clientX - startX;
            let dy = touch.clientY - startY;
            
            const maxDist = 50; 
            const dist = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx);
            
            const limitedDist = Math.min(dist, maxDist);
            vecX = Math.cos(angle) * limitedDist;
            vecY = Math.sin(angle) * limitedDist;
            
            hookKnob.style.transform = `translate(${vecX}px, ${vecY}px)`;
        }, { passive: false });

        window.addEventListener("touchend", e => {
            if (!joyActive) return;
            joyActive = false;
            
            hookKnob.style.transition = 'transform 0.2s ease-out';
            hookKnob.style.transform = `translate(0px, 0px)`;

            if (Math.hypot(vecX, vecY) > 15) {
                if (player.hasHookInInventory) {
                    const shootAngle = Math.atan2(vecY, vecX); 
                    if (player.hook) {
                        player.hook.shoot(shootAngle);
                        console.log("🎯 Выстрел по направлению!");
                    }
                } else {
                    console.log("⚠️ Крюка нет в инвентаре!");
                }
            }
            vecX = 0; vecY = 0;
        });
    }

    // --- ОБРАБОТКА ТАПА ПО ЭКРАНУ ДЛЯ МОБИЛЬНЫХ УСТРОЙСТВ ---
    const handleTouchStart = (e) => {
        // Чтобы не срабатывало при нажатии на кнопки управления или джойстик
        if (e.target.closest('#left') || e.target.closest('#right') || e.target.closest('#jump') || e.target.closest('#hook-joystick-container')) {
            return;
        }

        const touch = e.touches[0];
        const canvas = document.querySelector("canvas");
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const canvasX = touch.clientX - rect.left;
        const canvasY = touch.clientY - rect.top;

        // Переводим экранный тап в мировые координаты игры
        const worldClickX = canvasX + cameraX;
        const worldClickY = canvasY + cameraY;

        const currentChunkId = world.chunkManager.getChunkId(player.x);
        const chunk = world.chunkManager.chunks.get(currentChunkId);
        
        if (!chunk || !chunk.objects) return;

        for (let obj of chunk.objects) {
            // Ищем объект статуи, у которого есть функция взаимодействия
            if (obj && typeof obj.interact === 'function') {
                // Если у статуи есть конфиг, берем размеры из него, иначе используем стандартные
                const width = (obj.config && obj.config.width) || obj.width || 250;
                const height = (obj.config && obj.config.height) || obj.height || 350;

                // В классе Statue координата x часто указывает на её центр, скорректируем это:
                const statueLeft = obj.x - width / 2;
                const statueTop = obj.y - height; // Так как спавн идет от земли вверх

                // Проверяем попадание тапа в прямоугольник статуи
                const insideX = worldClickX >= statueLeft && worldClickX <= statueLeft + width;
                const insideY = worldClickY >= statueTop && worldClickY <= statueTop + height;

                if (insideX && insideY) {
                    // Проверяем дистанцию от игрока до центра статуи
                    const dx = (player.x + player.size / 2) - obj.x;
                    const dy = player.y - (obj.y - height / 2);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const radius = (obj.config && obj.config.interactionRadius) || 250;

                    if (distance <= radius) {
                        console.log("🗿 [Mobile] Статуя Босса Океана активирована тапом!");
                        obj.interact(player);
                        break;
                    } else {
                        console.log("⚠️ Слишком далеко для активации статуи!");
                    }
                }
            }
        }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
}