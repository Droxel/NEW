// trees.js
export function generateTree(x, world) {
  // 1️⃣ не в кратере и не у края кратера
  for (const c of world.craters) {
    const d = Math.abs(x - c.x);
    if (d < c.radius + 20) return; // +20 — защита от берегов
  }

  // 2️⃣ высота земли
  const half = world.treeWidth / 2;
  let groundMax = -Infinity;

  for (let dx = -half; dx <= half; dx += 10) {
    const gy = world.getGroundY(x + dx);
    if (gy > groundMax) groundMax = gy;
  }

  const y = groundMax;

  // 3️⃣ проверка воды
  for (const c of world.craters) {
    if (!c.hasWater) continue;
    if (x > c.leftEdgeX && x < c.rightEdgeX) {
      if (y < c.waterLevel + 5) return; // дерево в воде ❌
    }
  }

  // 4️⃣ проверка уклона
  const yL = world.getGroundY(x - 10);
  const yR = world.getGroundY(x + 10);
  if (Math.abs(yL - yR) > 18) return;

  return { x, y, width: world.treeWidth, height: world.treeHeight };
}
