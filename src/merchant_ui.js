// merchant_ui.js
import { merchant } from "./merchant.js";
import { player } from "./player.js";

export const merchantUI = {
  open: false,
update() {
  if (!merchant.isPlayerNear) {
    this.open = false;
  }
},

  toggle() {
    if (merchant.isPlayerNear) {
      this.open = !this.open;
    }
  },

  draw(ctx) {
    if (!this.open) return;

   const x = 40;
const y = 40;

const itemSize = 30;
const gap = 15;
const padding = 20;

const width =
  padding * 2 +
  merchant.goods.length * itemSize +
  (merchant.goods.length - 1) * gap;

const height = 120;

ctx.fillStyle = "rgba(0,0,0,0.7)";
ctx.fillRect(x, y, width, height);

    merchant.goods.forEach((item, i) => {
      ctx.fillStyle = item.color;
      ctx.fillRect(x + 20 + i * 45, y + 50, 30, 30);
    });
  },

  click(mx, my) {
    if (!this.open) return;

    merchant.goods.forEach((item, i) => {
      const bx = 60 + i * 45;
      const by = 90;

      if (
        mx > bx && mx < bx + 30 &&
        my > by && my < by + 30
      ) {
        player.color = item.color;
      }
    });
  }
};
