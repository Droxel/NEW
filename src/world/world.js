//world.js
import { generateTree } from './generators/trees.js';
import { generateCrater } from './generators/craters.js';
import { getBaseGroundY } from './heightmap.js';
import { generateWater } from "./generators/water.js";
import { CONFIG } from "../config.js";


export const world = {
  trees: [],
  craters: [],
  water: [],
  farLeft: 0,
  farRight: 0,

  step: 40,

  treeWidth: 200,
  treeHeight: 230,

  // Инициализация мира
init() {
  this.trees = [];
  this.craters = [];
  this.water = [];

  this.farLeft = -600;
  this.farRight = -600;
  
  // 1️⃣ КРАТЕРЫ (РЕЛЬЕФ)
  let cx = -1500;
  while (cx < 4000) {
    const crater = generateCrater(cx);
    if (crater) this.craters.push(crater);
    cx += 600;
  }

  // 2️⃣ ВОДА (ИСПОЛЬЗУЕТ КРАТЕРЫ)
  generateWater(this);

  // 3️⃣ ДЕРЕВЬЯ (ИСПОЛЬЗУЮТ getGroundY)
  let x = -600;
  while (x < 1200) {
    const tree = generateTree(x, this);
    if (tree) this.trees.push(tree);
    this.farRight = x;
    x += 80 + Math.random() * 140;
  }
},

  // Обновление мира
  update(playerX) {
    while (playerX + CONFIG.width > this.farRight) {
      this.farRight += 80 + Math.random() * 140;
      const tree = generateTree(this.farRight, this);
      if (tree) this.trees.push(tree);
    }

    while (playerX - CONFIG.width < this.farLeft) {
      this.farLeft -= 80 + Math.random() * 140;
      const tree = generateTree(this.farLeft, this);
      if (tree) this.trees.unshift(tree);
    }
  },

  // ГЕНЕРАЦИЯ ЗЕМЛИ С КРАТЕРАМИ
  getGroundY(x) {
    let y = getBaseGroundY(x);
    for (const c of this.craters) {
      const d = Math.abs(x - c.x);
      if (d < c.radius) {
        const t = d / c.radius;
        const smooth = 1 - t * t;
        y += smooth * c.depth;
      }
    }
    return y;
  },

};
