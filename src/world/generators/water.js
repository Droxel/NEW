// world/generators/water.js
export function generateWater(world) {
  world.water = [];

  for (const c of world.craters) {
    if (!c.hasWater) continue;

    const leftY  = world.getGroundY(c.leftEdgeX);
    const rightY = world.getGroundY(c.rightEdgeX);

    const level = Math.min(leftY, rightY);

    world.water.push({
      left: c.leftEdgeX,
      right: c.rightEdgeX,
      level,
      type: "water"
    });
  }
}
