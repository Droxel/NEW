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
}