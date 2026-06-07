// src/world/terrain/Height.js
import { CONFIG } from "../../data/config.js";
import { fbm, WORLD_SEED } from "../Seed.js";
import { getBiomeMix } from "./BiomeMap.js";
import { calculateOceanTerrain } from "../Ocean.js";
export function getHeight(x) {
    const base = CONFIG.groundY; 
    const mix = getBiomeMix(x);

    let chaos = fbm(x, { scale: 0.00005, octaves: 2, seed: WORLD_SEED + 9000 });
    chaos = Math.abs(chaos);
    chaos = Math.pow(chaos, 2);

    const baseNoise = fbm(x, { scale: 0.0012, octaves: 5, seed: WORLD_SEED });
    const mountains = fbm(x, { scale: 0.00015, octaves: 4, seed: WORLD_SEED + 1000 });
    // Увеличили глубину pits, чтобы они создавали естественные чаши для озер
    const pits = fbm(x, { scale: 0.00025, octaves: 3, seed: WORLD_SEED + 4000 }); 
    const detail = fbm(x, { scale: 0.008, octaves: 2, seed: WORLD_SEED + 2000 });

    const desertAmp = 25;
    const plainsAmp = 40;
    const forestAmp = 90;
    const jungleAmp = 160;
    const snowAmp = 250;

    const amp =
        desertAmp * mix.desert +
        plainsAmp * mix.plains +
        forestAmp * mix.forest +
        jungleAmp * mix.jungle +
        snowAmp * mix.snow;

let height = base;
    height += baseNoise * amp; 
    height += mountains * 6000 * chaos; 
    height += pits * -1200 * chaos; 
    height += detail * 25;

    // ВАЖНО: Пропускаем получившуюся высоту через Океан!
    // Если тут океан, он выроет впадины и сделает пляж
    height = calculateOceanTerrain(x, height);

    return height;
}