/* world.js */
import { CONFIG } from "./config.js";

export const world = {
  trees: [],

  // размеры деревьев
  treeWidth: 200,
  treeHeight: 230,

  // крайние точки мира
  farLeft: 0,
  farRight: 0,
// =====================
// 🌄 РЕЛЬЕФ ЗЕМЛИ
// =====================
getGroundY(x) {
  const baseY = CONFIG.groundY;

  // большие холмы
  const big =
    Math.sin(x * 0.002) * 40;

  // мелкая дрожь
  const small =
    Math.sin(x * 0.01) * 10;

  // редкие длинные формы
  const wide =
    Math.sin(x * 0.0007) * 60;

  let y = baseY + big + small + wide;

  // 🌿 ПЛАТО (ровные участки)
  const plateauNoise = Math.sin(x * 0.0003);

  if (Math.abs(plateauNoise) < 0.15) {
    y = baseY + wide * 0.4; // почти ровно
  }

  return y;
},


  // =====================
  // генерация деревьев
  // =====================
 
  generateTree(x, toLeft = false) {
   const y = this.getGroundY(x);

const tree = {
  x,
  y,
  width: this.treeWidth,
  height: this.treeHeight
};


    if (toLeft) {
      this.trees.unshift(tree);
    } else {
      this.trees.push(tree);
    }
  },

  // =====================
  // начальная генерация
  // =====================
  init() {
    this.trees = [];

    let x = -5 * 120;
    this.farLeft = x;
    this.farRight = x;

    while (x < 10 * 120) {
      const spacing = 50 + Math.random() * 150;

      this.generateTree(x);
      this.farRight = x;

      x += spacing;
    }
  },

  // =====================
  // обновление мира
  // =====================
  update(playerX) {
    // ===== ВПРАВО =====
    while (playerX + CONFIG.width > this.farRight) {
      const spacing = 50 + Math.random() * 150;
      this.farRight += spacing;

      this.generateTree(this.farRight);
    }

    // ===== ВЛЕВО =====
    while (playerX - CONFIG.width < this.farLeft) {
      const spacing = 50 + Math.random() * 150;
      this.farLeft -= spacing;

      this.generateTree(this.farLeft, true);
    }
  }
};
