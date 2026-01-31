// heightmap.js
import { CONFIG } from "../config.js";

export function getBaseGroundY(x) {
  const base = CONFIG.groundY;

  const mega  = Math.sin(x * 0.00008) * 260;
  const big   = Math.sin(x * 0.0003)  * 140;
  const mid   = Math.sin(x * 0.0012)  * 50;
  const small = Math.sin(x * 0.006)   * 12;

  return base + mega + big + mid + small;
}
