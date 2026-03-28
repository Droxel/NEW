// src/world/terrain/BiomeMap.js
import { fbm, WORLD_SEED } from "../Seed.js";
import { GameState } from "../../core/GameState.js";

export function getBiomeValue(x) {
    // Основной шум биомов
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

    // Вместо возврата плоского 0.16, мы плавно подмешиваем "целевое значение" джунглей к шуму
    if (dist > JUNGLE_START - BLEND && dist < JUNGLE_END + BLEND) {
        let t = 0;
        if (dist < JUNGLE_START) t = (dist - (JUNGLE_START - BLEND)) / BLEND;
        else if (dist > JUNGLE_END) t = 1 - (dist - JUNGLE_END) / BLEND;
        else t = 1;
        
        // Смешиваем шум с константой джунглей (0.5 - это примерно центр диапазона джунглей ниже)
        return naturalNoise * (1 - t) + 0.1 * t; 
    }

    return naturalNoise;
}

export function getBiomeMix(x) {
    const v = (getBiomeValue(x) + 1) / 2; 
    const villageNoise = (fbm(x, { scale: 0.0005, octaves: 2, seed: WORLD_SEED + 12345 }) + 1) / 2;
    
    // ВОТ ТУТ ДОБАВИЛ corruption = 0
    let desert = 0, plains = 0, forest = 0, jungle = 0, snow = 0, village = 0, corruption = 0; 
    
    const transition = 0.15;
    // Сначала рассчитываем обычные биомы
    if (v < 0.2) {
        desert = 1;
    } else if (v < 0.2 + transition) {
        const t = (v - 0.2) / transition;
        desert = 1 - t;
        plains = t;
    } else if (v < 0.4) {
        plains = 1;
    } else if (v < 0.4 + transition) {
        const t = (v - 0.4) / transition;
        plains = 1 - t;
        forest = t;
    } else if (v < 0.6) {
        forest = 1;
    } else if (v < 0.6 + transition) {
        const t = (v - 0.6) / transition;
        forest = 1 - t;
        jungle = t;
    } else if (v < 0.8) {
        jungle = 1;
    } else if (v < 0.8 + transition) {
        const t = (v - 0.8) / transition;
        jungle = 1 - t;
        snow = t;
    } else {
        snow = 1;
    }

    // Плавно вплавляем деревню, если шум высокий (например > 0.7)
if (villageNoise > 0.65) {
        const vt = Math.min(1, (villageNoise - 0.65) / 0.1); 
        village = vt;
        const invVt = 1 - vt;
        desert *= invVt; plains *= invVt; forest *= invVt; jungle *= invVt; snow *= invVt;
    }

// --- ВТОРЖЕНИЕ ПОРЧИ ---
const level = GameState.corruptionLevel;

if (level > 0) {
    // Шум для порчи
    const corruptionNoise = (fbm(x, { scale: 0.0003, octaves: 2, seed: WORLD_SEED + 666 }) + 1) / 2;
    
    // Порог появления порчи становится ниже с каждым боссом
    // Level 1: только если шум > 0.9 (очень редко)
    // Level 2: если шум > 0.8
    // Level 3: если шум > 0.7
    const threshold = 0.95 - (level * 0.08); 

    if (corruptionNoise > threshold) {
        const ct = Math.min(1, (corruptionNoise - threshold) / 0.1);
        corruption = ct;
        const invCt = 1 - ct;
        // Подавляем остальные биомы
        desert *= invCt; plains *= invCt; forest *= invCt; jungle *= invCt; snow *= invCt; village *= invCt;
    }
}

    return { desert, plains, forest, jungle, snow, village, corruption };
}

export function getBiome(x) {
    const m = getBiomeMix(x);
    const maxWeight = Math.max(m.desert, m.plains, m.forest, m.jungle, m.snow, m.village, m.corruption || 0);
    
    if (m.corruption === maxWeight) return "corruption"; // <--- НОВЫЙ БИОМ
    if (m.village === maxWeight) return "village";
    if (m.desert === maxWeight) return "desert";
    if (m.plains === maxWeight) return "plains";
    if (m.forest === maxWeight) return "forest";
    if (m.jungle === maxWeight) return "jungle";
    return "snow";
}
export function isLargeBiome(x, targetBiome, range = 400) {
    const points = [-range, -range/2, 0, range/2, range];
    for (let offset of points) {
        const mix = getBiomeMix(x + offset);
        // Проверяем, является ли целевой биом доминирующим в этой точке
        if (mix[targetBiome] < 0.5) {
            return false;
        }
    }
    return true;
}