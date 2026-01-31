/* world.js */


export const world = {
  trees: [],

  step: 40,

  treeWidth: 200,
  treeHeight: 230,

  farLeft: 0,
  farRight: 0,

  craters: [],

  // =====================
  // 🌄 ЧИСТАЯ ЗЕМЛЯ (БЕЗ КРАТЕРОВ)
  // =====================
  getBaseGroundY(x) {
    const base = CONFIG.groundY;

    const mega  = Math.sin(x * 0.00008) * 260;
    const big   = Math.sin(x * 0.0003)  * 140;
    const mid   = Math.sin(x * 0.0012)  * 50;
    const small = Math.sin(x * 0.006)   * 12;

    return base + mega + big + mid + small;
  },

  // =====================
  // 🌍 ЗЕМЛЯ С КРАТЕРАМИ
  // =====================
  getGroundY(x) {
    let y = this.getBaseGroundY(x);

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

  // =====================
  // 🌲 ДЕРЕВЬЯ
  // =====================
  generateTree(x, toLeft = false) {

  // 1️⃣ не в кратере и не у края кратера
  for (const c of this.craters) {
    const d = Math.abs(x - c.x);
    if (d < c.radius + 20) return; // +20 — защита от берегов
  }

  // 2️⃣ высота земли
  // ширина дерева
const half = this.treeWidth / 2;

// берём несколько точек под деревом
let groundMax = -Infinity;

for (let dx = -half; dx <= half; dx += 10) {
  const gy = this.getGroundY(x + dx);
  if (gy > groundMax) groundMax = gy;
}

const y = groundMax;


  // 3️⃣ проверка воды
  for (const c of this.craters) {
    if (!c.hasWater) continue;

    if (x > c.leftEdgeX && x < c.rightEdgeX) {
      if (y < c.waterLevel + 5) return; // дерево в воде ❌
    }
  }

  // 4️⃣ проверка уклона (чтобы не висели)
  const yL = this.getGroundY(x - 10);
  const yR = this.getGroundY(x + 10);

  if (Math.abs(yL - yR) > 18) return; // слишком крутой склон

  // ✅ всё ок — создаём дерево
  const tree = {
    x,
    y,
    width: this.treeWidth,
    height: this.treeHeight
  };

  if (toLeft) this.trees.unshift(tree);
  else this.trees.push(tree);
},

  // =====================
  // 🛠 ИНИЦИАЛИЗАЦИЯ МИРА
  // =====================
  init() {
    // --- деревья ---
    this.trees = [];

    let x = -600;
    this.farLeft = x;
    this.farRight = x;

    while (x < 1200) {
      this.generateTree(x);
      this.farRight = x;
      x += 80 + Math.random() * 140;
    }

    // --- кратеры ---
    this.craters = [];

    let cx = -1500;
    while (cx < 4000) {

      if (Math.random() < 0.4) {
        const x0 = cx + Math.random() * 600;
        const radius = 140 + Math.random() * 180;
        const depth = 40 + Math.random() * 140;

        // ⬇️ БЕРЕГА СЧИТАЕМ ПО ЧИСТОЙ ЗЕМЛЕ
        const leftEdgeX  = x0 - radius;
        const rightEdgeX = x0 + radius;

        const leftEdgeY  = this.getBaseGroundY(leftEdgeX);
        const rightEdgeY = this.getBaseGroundY(rightEdgeX);

        const waterLevel = Math.min(leftEdgeY, rightEdgeY);

        this.craters.push({
          x: x0,
          radius,
          depth,
          hasWater: depth > 90,

          leftEdgeX,
          rightEdgeX,
          leftEdgeY,
          rightEdgeY,

          waterLevel
        });
      }

      cx += 600;
    }
  },

  // =====================
  // 🔄 ОБНОВЛЕНИЕ МИРА
  // =====================
  update(playerX) {

    while (playerX + CONFIG.width > this.farRight) {
      this.farRight += 80 + Math.random() * 140;
      this.generateTree(this.farRight);
    }

    while (playerX - CONFIG.width < this.farLeft) {
      this.farLeft -= 80 + Math.random() * 140;
      this.generateTree(this.farLeft, true);
    }
  }
};
