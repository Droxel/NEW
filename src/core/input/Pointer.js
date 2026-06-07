// src/core/input/Pointer.js
import { merchant } from "../../entities/npcs/Merchant.js";
import { MerchantUI } from "../../ui/screens/MerchantUI.js"; 
// Добавляем импорт zoomLevel (убедись, что он экспортируется из Braw.js)
import { cameraX, cameraY, zoomLevel } from "../Braw.js"; 
import { allNPCs } from "../../main.js"; 
import { world } from "../../world/World.js"; 
import { bossManager } from "../../entities/bosses/BossManager.js"; 

export function setupPointer(player, canvas, state) {
    canvas.addEventListener("mousemove", e => {
        state.mouseX = e.offsetX;
        state.mouseY = e.offsetY;
    });

    canvas.addEventListener("click", e => {
        handleWorldClick(e.offsetX, e.offsetY, player);
    });

    canvas.addEventListener("touchstart", e => {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        handleWorldClick(touch.clientX - rect.left, touch.clientY - rect.top, player);
    });
}

function handleWorldClick(x, y, player) {
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ:
    // Сначала делим экранную координату на зум, а потом добавляем положение камеры
    const mx = (x / zoomLevel) + cameraX;
    const my = (y / zoomLevel) + cameraY;

    // --- 1. ПРОВЕРКА ИНТЕРФЕЙСА МАГАЗИНА ---
    // UI обычно рисуется поверх всего без зума, поэтому здесь оставляем x и y
    if (MerchantUI.open && MerchantUI.currentNPC) {
       const goods = MerchantUI.currentNPC.goods;
       const uiX = 40, uiY = 40, itemSize = 40, gap = 15, padding = 20;
       const width = padding * 2 + goods.length * itemSize + (goods.length - 1) * gap;
       const height = 140;

       if (x > uiX && x < uiX + width && y > uiY && y < uiY + height) {
           MerchantUI.click(x, y);
           return; 
       }
    }

    // --- 2. ПРОВЕРКА NPC (теперь mx и my верные) ---
    if (merchant.active && merchant.isPlayerNear) {
      if (mx > merchant.x && mx < merchant.x + merchant.size &&
          my > merchant.y - merchant.size && my < merchant.y) {
        MerchantUI.open && MerchantUI.currentNPC === merchant ? MerchantUI.open = false : MerchantUI.startTrade(merchant);
        return;
      }
    }
    let npcClicked = false;
    allNPCs.forEach(npc => {
        if (npc.active && npc.isPlayerNear) {
            if (mx > npc.x - npc.size && mx < npc.x + npc.size &&
                my > npc.y - npc.size * 2 && my < npc.y) {
                MerchantUI.open && MerchantUI.currentNPC === npc ? MerchantUI.open = false : MerchantUI.startTrade(npc);
                npcClicked = true;
            }
        }
    });
    if (npcClicked) return;
    
// --- 3. ВЗАИМОДЕЙСТВИЕ С ОБЪЕКТАМИ МИРА ---
    const currentChunkId = world.chunkManager.getChunkId(mx);
    const chunk = world.chunkManager.chunks.get(currentChunkId);
    
    if (chunk) {
        // Сундуки
        chunk.objects.forEach(obj => {
            if (obj.type === "chest" && obj.instance) {
                const chest = obj.instance;
                if (mx > chest.x && mx < chest.x + chest.width &&
                    my > chest.y && my < chest.y + chest.height) {
                    const dist = Math.abs(player.x - chest.x);
                    if (dist < 100) chest.interact();
                }
            }
        });

        // Статуи
        if (chunk.statues) {
            chunk.statues.forEach(statue => {
                if (mx > statue.x - statue.width/2 && mx < statue.x + statue.width/2 &&
                    my > statue.y - statue.height && my < statue.y) {
                    statue.interact(player); 
                }
            });
        }
    }
}
