// src/world/terrain/Height.js
import { CONFIG } from "../../data/config.js";
import { fbm, WORLD_SEED, getLakeIntensity } from "../Seed.js";
import { getBiomeMix } from "./BiomeMap.js";

export function getHeight(x) {
    const base = CONFIG.groundY; 
    const mix = getBiomeMix(x);
    const lakeFactor = Math.max(0, getLakeIntensity(x)); 

    // Глубина ямы озера. В Canvas Y идет вниз, поэтому мы будем ПРИБАВЛЯТЬ это к высоте.
    const depth = lakeFactor * 700; 

    let chaos = fbm(x, { scale: 0.00005, octaves: 2, seed: WORLD_SEED + 9000 });
    chaos = Math.abs(chaos);
    chaos = Math.pow(chaos, 2);

    const baseNoise = fbm(x, { scale: 0.0012, octaves: 5, seed: WORLD_SEED });
    const mountains = fbm(x, { scale: 0.00015, octaves: 4, seed: WORLD_SEED + 1000 });
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

    // Сглаживаем горы и ямы внутри озера
    const suppression = Math.max(0, 1 - lakeFactor * 1.5); 

    let height = base;
    height += baseNoise * amp; 
    height += mountains * 6000 * chaos * suppression; 
    height += pits * -900 * chaos * suppression;     
    
    // Выкапываем саму яму для воды (дно уходит вниз)
    height += depth;

    // Мелкие детали тоже сглаживаем на дне, чтобы оно было более ровным
    height += detail * 25 * suppression;

    return height;
}

export function getShoreHeight(x) {
    const base = CONFIG.groundY; 
    const mix = getBiomeMix(x);
    
    // Берем ту же основу, что и у земли, но БЕЗ ям и гор
    const baseNoise = fbm(x, { scale: 0.0012, octaves: 5, seed: WORLD_SEED });

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

    // Возвращаем идеальную высоту земли в этой точке
    return base + baseNoise * amp;
}