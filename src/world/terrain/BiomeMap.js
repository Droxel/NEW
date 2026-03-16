// src/world/terrain/BiomeMap.js
import { fbm, WORLD_SEED } from "../Seed.js";

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
    const v = (getBiomeValue(x) + 1) / 2; // Приводим к 0..1

    // Шум для деревни
    const villageNoise = (fbm(x, {
        scale: 0.0005, 
        octaves: 2,
        seed: WORLD_SEED + 12345
    }) + 1) / 2;

    let desert = 0, plains = 0, forest = 0, jungle = 0, snow = 0, village = 0;
    const transition = 0.15; // Увеличили для большей плавности

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
        const vt = Math.min(1, (villageNoise - 0.65) / 0.1); // Плавный переход в 0.1 диапазона
        village = vt;
        const invVt = 1 - vt;
        // Уменьшаем влияние остальных биомов
        desert *= invVt; plains *= invVt; forest *= invVt; jungle *= invVt; snow *= invVt;
    }

    return { desert, plains, forest, jungle, snow, village };
}

export function getBiome(x) {
    const m = getBiomeMix(x);
    // Берем биом с наибольшим весом
    const maxWeight = Math.max(m.desert, m.plains, m.forest, m.jungle, m.snow, m.village);
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