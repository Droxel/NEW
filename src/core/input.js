/* src/core/input.js */
import { merchant } from "../entities/npcs/merchant.js";
import { merchantUI } from "../ui/merchant_ui.js";
import { cameraX, cameraY } from "./braw.js";
import { allNPCs } from "./main.js";
import { world } from "../world/world.js"; 
import { bossManager } from "../entities/bosses/BossManager.js"; 
import { GrapplingHook } from "../entities/GrapplingHook.js";

export let moveLeft = false;
export let moveRight = false;
export let jumpPressed = false; 

export function setupInput(player) {

  // КЛАВИАТУРА
  document.addEventListener("keydown", e => {
    if (e.code === "KeyA") moveLeft = true;
    if (e.code === "KeyD") moveRight = true;
    if (e.code === "Space") {
        jumpPressed = true;
        player.jump(); 
    }
    
    if (e.code === "KeyE") {
        checkStatueInteraction(player);
    }
  });

  document.addEventListener("keyup", e => {
    if (e.code === "KeyA") moveLeft = false;
    if (e.code === "KeyD") moveRight = false;
    if (e.code === "Space") jumpPressed = false; 
  });

  // МОБИЛЬНОЕ УПРАВЛЕНИЕ
  const leftBtn  = document.getElementById("left");
  const rightBtn = document.getElementById("right");
  const jumpBtn  = document.getElementById("jump");

  if (leftBtn && rightBtn && jumpBtn) {
    leftBtn.addEventListener("touchstart", e => { e.preventDefault(); moveLeft = true; });
    leftBtn.addEventListener("touchend", () => { moveLeft = false; });
    
    rightBtn.addEventListener("touchstart", e => { e.preventDefault(); moveRight = true; });
    rightBtn.addEventListener("touchend", () => { moveRight = false; });
    
    jumpBtn.addEventListener("touchstart", e => { 
        e.preventDefault(); 
        jumpPressed = true; 
        player.jump(); 
    });
    jumpBtn.addEventListener("touchend", () => { 
        jumpPressed = false; 
    });
  }

  const canvas = document.getElementById("game");

  function handlePointer(x, y) {
    const mx = x + cameraX;
    const my = y + cameraY;

    // --- 1. ПРОВЕРКА ИНТЕРФЕЙСА МАГАЗИНА (Блокировка кликов) ---
    if (merchantUI.open && merchantUI.currentNPC) {
       // Рассчитываем размеры окна магазина так же, как в merchantUI.draw
       const goods = merchantUI.currentNPC.goods;
       const uiX = 40;
       const uiY = 40;
       const itemSize = 40;
       const gap = 15;
       const padding = 20;
       const width = padding * 2 + goods.length * itemSize + (goods.length - 1) * gap;
       const height = 140;

       // Если клик попал в область окна магазина
       if (x > uiX && x < uiX + width && y > uiY && y < uiY + height) {
           merchantUI.click(x, y);
           return; // <--- ВАЖНО: Прекращаем выполнение, чтобы не призвать босса
       }
    }

    // --- 2. ОТКРЫТИЕ МАГАЗИНА ---
    // Если игрок кликает по самому торговцу
    if (merchant.active && merchant.isPlayerNear) {
      if (mx > merchant.x && mx < merchant.x + merchant.size &&
          my > merchant.y - merchant.size && my < merchant.y) {
        if (merchantUI.open && merchantUI.currentNPC === merchant) {
             merchantUI.open = false;
        } else {
             merchantUI.startTrade(merchant);
        }
        return;
      }
    }

    let npcClicked = false;
    allNPCs.forEach(npc => {
        if (npc.active && npc.isPlayerNear) {
            if (mx > npc.x - npc.size && mx < npc.x + npc.size &&
                my > npc.y - npc.size * 2 && my < npc.y) {
                
                if (merchantUI.open && merchantUI.currentNPC === npc) {
                    merchantUI.open = false;
                } else {
                    merchantUI.startTrade(npc);
                }
                npcClicked = true;
            }
        }
    });
    if (npcClicked) return;
    
// --- 3. ВЗАИМОДЕЙСТВИЕ С МИРОМ ---
    const currentChunkId = world.chunkManager.getChunkId(mx);
    const chunk = world.chunkManager.chunks.get(currentChunkId);
    
    // Мы в Chunk.js сохранили их в массив objects с type: "chest"
        chunk.objects.forEach(obj => {
            if (obj.type === "chest") {
                const chest = obj.instance;
                // Простая проверка попадания клика
                if (mx > chest.x && mx < chest.x + chest.width &&
                    my > chest.y && my < chest.y + chest.height) {
                    
                    // Проверка дистанции (чтобы не открывать через полкарты)
                    const dist = Math.abs(player.x - chest.x);
                    if (dist < 100) {
                        chest.interact();
                    }
                }
            }
        });
    if (chunk && chunk.statues) {
        chunk.statues.forEach(statue => {
            if (mx > statue.x - statue.width/2 && mx < statue.x + statue.width/2 &&
                my > statue.y - statue.height && my < statue.y) {
                statue.interact(player, bossManager); 
            }
        });
    }
  }

function checkStatueInteraction(player) {
      const currentChunkId = world.chunkManager.getChunkId(player.x);
      const chunk = world.chunkManager.chunks.get(currentChunkId);
      
      if (chunk) {
          // Проверка сундуков на кнопку E
          chunk.objects.forEach(obj => {
              if (obj.type === "chest" && obj.instance) {
                  const chest = obj.instance;
                  // Если игрок рядом
                  if (Math.abs(player.x - (chest.x + chest.width/2)) < 50) {
                      chest.interact();
                  }
              }
          });

          // (Твой код статуй)
          if (chunk.statues) {
              chunk.statues.forEach(statue => {
                 statue.interact(player, bossManager);
              });
          }
      }
  }

  canvas.addEventListener("click", e => {
    handlePointer(e.offsetX, e.offsetY);
  });

  canvas.addEventListener("touchstart", e => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    handlePointer(touch.clientX - rect.left, touch.clientY - rect.top);
  });
// --- ИНИЦИАЛИЗАЦИЯ КРЮКА ---
if (!player.hook) {
    player.hook = new GrapplingHook(player);
    console.log("✅ Система крюка готова!");
}

// 1. Отслеживаем позицию мыши (для выстрела на G)
let mouseX = 0;
let mouseY = 0;
canvas.addEventListener("mousemove", e => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
});

// 1. Обновление для клавиатуры (Клавиша G)
document.addEventListener("keydown", e => {
    if (e.code === "KeyG") {
        if (player.hasHookInInventory) {
            // СЧИТАЕМ УГОЛ ОТ ИГРОКА К КУРСОРУ
            const playerCenterX = player.x + player.size / 2;
            const playerCenterY = player.y + player.size / 2;
            
            // Мировые координаты мыши
            const worldMouseX = mouseX + cameraX;
            const worldMouseY = mouseY + cameraY;

            // Вычисляем угол в радианах
            const angle = Math.atan2(worldMouseY - playerCenterY, worldMouseX - playerCenterX);
            
            console.log("🚀 Выстрел крюком по углу:", angle);
            player.hook.shoot(angle); 
        } else {
            console.log("⚠️ Крюка нет в инвентаре!");
        }
    }
    
    if (e.code === "Space" && player.hook && player.hook.active) {
        player.hook.release();
    }
});

// 2. Исправленный Джойстик (Прямое управление)
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

    // Слушаем движение по всему экрану, чтобы палец не срывался
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

        // ВЫСТРЕЛ: Куда тянули, туда и летит
        if (Math.hypot(vecX, vecY) > 15) {
            // 👇 ДОБАВЛЕНА ПРОВЕРКА ИНВЕНТАРЯ 👇
            if (player.hasHookInInventory) {
                const shootAngle = Math.atan2(vecY, vecX); 
                
                if (player.hook) {
                    player.hook.shoot(shootAngle);
                    console.log("🎯 Выстрел по направлению!");
                }
            } else {
                console.log("⚠️ Крюка нет в инвентаре!");
            }
            // 👆 КОНЕЦ ПРОВЕРКИ 👆
        }
        
        vecX = 0; vecY = 0;
    });
}
}