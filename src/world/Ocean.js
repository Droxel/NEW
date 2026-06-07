// src/world/Ocean.js
import { fbm, WORLD_SEED } from "./Seed.js";
import { CONFIG } from "../data/config.js";

export const OCEAN = {
    START: 80000,           // Базовая точка начала океана (Берег 1)
    WIDTH: 200000,          // <-- ОТВЕТ НА ТВОЙ ВОПРОС: Размер океана (расстояние до Берега 2)
    TRANSITION: 12000,      // Длина пляжа и мелководья до максимальной глубины
    MAX_DEPTH: 2500        // Максимальная глубина (дно)
};

export const OCEAN_WATER_LEVEL = CONFIG.groundY + 150; 

const smoothstep = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a * (1 - t) + b * t;

export function getOceanMix(x) {
    const dist = Math.abs(x);
    const coastOffset = fbm(x, { scale: 0.001, octaves: 2, seed: WORLD_SEED + 101 }) * 200;
    const realStart = OCEAN.START + coastOffset;
    const realEnd = realStart + OCEAN.WIDTH;

    // --- ПЛАВНЫЙ ВХОД В БИОМ ---
    const FADE_IN = 3000; // Дистанция, за которую земля начинает превращаться в пляж
    
    // Если мы совсем далеко от океана
    if (dist < realStart - FADE_IN || dist > realEnd + FADE_IN) {
        return { beach: 0, shallows: 0, deep: 0, active: false, weight: 0 };
    }

    // Ищем расстояние до ближайшей воды (даже если мы еще на суше)
    const distToWater = (dist < realStart) ? (realStart - dist) : (dist > realEnd ? dist - realEnd : 0);
    
    // Если мы в зоне затухания (на подходе к пляжу)
    if (distToWater > 0) {
        const fadeT = 1 - (distToWater / FADE_IN);
        // Возвращаем слабую активность океана для плавного цвета песка
        return { beach: fadeT, shallows: 0, deep: 0, active: true, weight: 0, isTransition: true };
    }

    // --- ЛОГИКА ВНУТРИ ОКЕАНА (уже была у тебя) ---
    const distToStart = dist - realStart;
    const distToEnd = realEnd - dist;
    const distToClosestShore = Math.min(distToStart, distToEnd);

    let rawT = distToClosestShore / OCEAN.TRANSITION;
    rawT = Math.max(0, Math.min(1, rawT));
    const t = smoothstep(rawT);

    return { 
        beach: t < 0.2 ? 1 : 0, 
        shallows: (t >= 0.2 && t < 0.6) ? 1 : 0, 
        deep: t >= 0.6 ? 1 : 0, 
        active: true, 
        weight: t 
    };
}

export function calculateOceanTerrain(x, baseTerrainHeight) {
    const mix = getOceanMix(x);
    if (!mix.active) return baseTerrainHeight;

    const t = mix.weight;
    
    // --- НОВАЯ ЛОГИКА БЕРЕГА ---
    // Нам нужно ОЧЕНЬ быстро свести любую гору/низину к идеальному уровню воды
    // Умножаем t на 5, чтобы берег выровнялся уже на стадии пляжа
    const shoreT = smoothstep(Math.min(1, t * 5)); 
    
    // Идеальная высота, где вода касается суши
    const shoreLevel = OCEAN_WATER_LEVEL; 

    // Сначала сплющиваем материк к кромке берега
    const flattenedBase = lerp(baseTerrainHeight, shoreLevel, shoreT);

    // Шум дна
    const largeNoise  = fbm(x, { scale: 0.0001, octaves: 2, seed: WORLD_SEED + 111 }) * 800;
    const mediumNoise = fbm(x, { scale: 0.0005, octaves: 2, seed: WORLD_SEED + 222 }) * 300;
    const smallNoise  = fbm(x, { scale: 0.002, octaves: 2,  seed: WORLD_SEED + 333 }) * 80;
    const bottomNoise = (largeNoise + mediumNoise + smallNoise) * t;

    // Теперь копаем дно от ровного берега (shoreLevel), а не от непонятных гор!
    const depth = OCEAN.MAX_DEPTH * Math.pow(t, 2);
    const targetBottom = Math.max(
    shoreLevel + 20, // минимальная глубина
    shoreLevel + depth + bottomNoise
);

    // Плавно переходим от выровненного берега ко дну
    return lerp(flattenedBase, targetBottom, t);
}

// Вода океана остается твоей
export function getOceanWaterData(x, y, groundY) {
    const mix = getOceanMix(x);
    if (!mix.active) return { isWater: false };

    const level = OCEAN_WATER_LEVEL;
    const bottom = groundY;

    // Считаем, что вода есть, если мы отошли от берега (weight > 0)
    // и уровень дна позволяет ей там быть
    const isWaterHere = mix.weight > 0.01 && bottom > level;

    const inWater = (y !== undefined && y !== null)
        ? (y >= level && y <= bottom)
        : false;

    return {
        isWater: isWaterHere,
        inWater,
        level,
        bottom,
        depthFactor: mix.weight,
        isActiveZone: true
    };
}