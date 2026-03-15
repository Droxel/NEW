// src/world/terrain/BiomeMap.js
import { fbm, WORLD_SEED } from "../Seed.js"; // Объединили и исправили регистр S

export function getBiomeValue(x) {
    const naturalNoise = fbm(x, {
        scale: 0.0001, 
        octaves: 4,
        persistence: 0.5,
        seed: WORLD_SEED + 5000
    });

    const dist = Math.abs(x);
    const JUNGLE_START = 3000; 
    const JUNGLE_END = 8000;
    const BLEND = 1000;

    if (dist > JUNGLE_START && dist < JUNGLE_END) {
        return 0.16; 
    } 
    else if (dist >= JUNGLE_START - BLEND && dist <= JUNGLE_START) {
        const t = (dist - (JUNGLE_START - BLEND)) / BLEND;
        return naturalNoise * (1 - t) + 0.16 * t;
    }
    else if (dist >= JUNGLE_END && dist <= JUNGLE_END + BLEND) {
        const t = (dist - JUNGLE_END) / BLEND;
        return 0.16 * (1 - t) + naturalNoise * t;
    }

    return naturalNoise;
}

export function getBiomeMix(x){
    const v = (getBiomeValue(x) + 1) / 2; 

    let desert = 0, plains = 0, forest = 0, jungle = 0, snow = 0;
    const transition = 0.03; 

    if (v < 0.15) {
        desert = 1;
    }
    else if (v < 0.15 + transition) {
        desert = 1 - (v - 0.15) / transition;
        plains = (v - 0.15) / transition;
    }
    else if (v < 0.3) {
        plains = 1;
    }
    else if (v < 0.3 + transition) {
        plains = 1 - (v - 0.3) / transition;
        forest = (v - 0.3) / transition;
    }
    else if (v < 0.5) {
        forest = 1;
    }
    else if (v < 0.5 + transition) {
        forest = 1 - (v - 0.5) / transition;
        jungle = (v - 0.5) / transition;
    }
    else if (v < 0.65) {
        jungle = 1;
    }
    else if (v < 0.65 + transition) {
        jungle = 1 - (v - 0.65) / transition;
        snow = (v - 0.65) / transition;
    }
    else {
        snow = 1;
    }

    return { desert, plains, forest, jungle, snow };
}

export function getBiome(x){
    const m = getBiomeMix(x);
    if (m.desert > 0.5) return "desert";
    if (m.plains > 0.5) return "plains";
    if (m.forest > 0.5) return "forest";
    if (m.jungle > 0.5) return "jungle";
    return "snow";
}

export function isLargeBiome(x, targetBiome, range = 400) {
    const points = [-range, -range/2, 0, range/2, range];
    
    for (let offset of points) {
        if (getBiome(x + offset) !== targetBiome) {
            return false;
        }
    }
    return true;
}