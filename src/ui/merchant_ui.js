// merchant_ui.js
import { player } from "../entities/player.js";

export const merchantUI = {
  open: false,
  currentNPC: null, 
  
  // Кэш для изображений, чтобы не мерцало
  imageCache: {},

  startTrade(npc) {
    this.currentNPC = npc;
    this.open = true;
  },

  update() {
    if (!this.open || !this.currentNPC) return;
    if (!this.currentNPC.isPlayerNear) {
      this.open = false;
      this.currentNPC = null;
    }
  },

  draw(ctx) {
    if (!this.open || !this.currentNPC) return;

    const goods = this.currentNPC.goods;
    const x = 40;
    const y = 40;
    const itemSize = 40;
    const gap = 15;
    const padding = 20;

    const width = padding * 2 + goods.length * itemSize + (goods.length - 1) * gap;
    const height = 140; 

    // Фон окна
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = "#8b4513";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Имя продавца
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(this.currentNPC.name || "Магазин", x + 10, y + 25);
    
    // Баланс игрока
    if (player.inventory) {
        ctx.fillStyle = "#4dff4d";
        ctx.font = "12px monospace";
        ctx.fillText(`Кристаллов: ${player.inventory.getCrystalCount()}`, x + 100, y + 25);
    }

    // Рисуем товары
    goods.forEach((item, i) => {
      const bx = x + padding + i * (itemSize + gap);
      const by = y + 45;

      // Рамка слота
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.strokeRect(bx, by, itemSize, itemSize);

      // --- ОТРИСОВКА ПРЕДМЕТА ---
      if (item.color) {
          // Это скин (цветной квадрат)
          ctx.fillStyle = item.color;
          ctx.fillRect(bx + 5, by + 5, itemSize - 10, itemSize - 10);
      } else if (item.icon) {
          // Это предмет (картинка)
          if (!this.imageCache[item.icon]) {
              const img = new Image();
              img.src = item.icon;
              this.imageCache[item.icon] = img;
          }
          const img = this.imageCache[item.icon];
          if (img.complete) {
              ctx.drawImage(img, bx + 5, by + 5, itemSize - 10, itemSize - 10);
          }
      }
      
      // Цена
      ctx.fillStyle = "yellow";
      ctx.font = "10px monospace";
      const priceText = (typeof item.price === 'number') ? item.price + "$" : "FREE";
      ctx.fillText(priceText, bx, by + itemSize + 12);
    });
  },

  click(mx, my) {
    if (!this.open || !this.currentNPC) return;

    const goods = this.currentNPC.goods;
    const x = 40;
    const y = 40;
    const padding = 20;
    const itemSize = 40;
    const gap = 15;

    goods.forEach((item, i) => {
      const bx = x + padding + i * (itemSize + gap);
      const by = y + 45;

      if (mx > bx && mx < bx + itemSize && my > by && my < by + itemSize) {
        
        // Логика покупки
        if (item.color) {
            player.color = item.color;
            console.log("Скин изменен:", item.name);
        } else if (item.price && player.inventory) {
            if (player.inventory.getCrystalCount() >= item.price) {
                const added = player.inventory.addItem(item);
                if (added) {
                    player.inventory.spendCrystals(item.price);
                    console.log("Куплено:", item.name);
                    
                    // !!! ВАЖНО: Обновляем интерфейс инвентаря сразу после покупки
                    if (window.inventoryUI) {
                        window.inventoryUI.refresh(); 
                    }
                } else {
                    console.log("Инвентарь полон!");
                }
            } else {
                console.log("Недостаточно кристаллов!");
            }
        }
      }
    });
  }
};