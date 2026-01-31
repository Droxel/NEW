//craters.js
import { getBaseGroundY } from "../heightmap.js";


export function generateCrater(cx) {
  if (Math.random() < 0.4) {
    const x0 = cx + Math.random() * 600;
    const radius = 140 + Math.random() * 180;
    const depth = 40 + Math.random() * 140;

    const leftEdgeX  = x0 - radius;
    const rightEdgeX = x0 + radius;

    const leftEdgeY  = getBaseGroundY(leftEdgeX);
    const rightEdgeY = getBaseGroundY(rightEdgeX);

    const waterLevel = Math.min(leftEdgeY, rightEdgeY);

    return {
      x: x0,
      radius,
      depth,
      hasWater: depth > 90,
      leftEdgeX,
      rightEdgeX,
      leftEdgeY,
      rightEdgeY,
      waterLevel
    };
  }
  return null;
}
