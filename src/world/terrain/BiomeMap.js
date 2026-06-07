// src/world/terrain/BiomeMap.js
import { fbm, WORLD_SEED } from "../Seed.js";
import { GameState } from "../../core/GameState.js";
import { getOceanMix } from "../Ocean.js";

export function getBiomeValue(x) {
    // Основной шум биомов
    const naturalNoise = fbm(x, {
        scale: 0.00003, // Сделали в 3 раза крупнее (было 0.0001)
        octaves: 2,     // Убрали лишнюю "шершавость" шума
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
    
    let desert = 0, plains = 0, forest = 0, jungle = 0, snow = 0, village = 0, corruption = 0; 
    let beach = 0, ocean = 0;
    
    // Оставляем небольшую мягкость переходов
    const transition = 0.1; 

    if (v < 0.2) { 
        // 0.0 - 0.2: Чистая пустыня
        desert = 1;
    } else if (v < 0.2 + transition) {
        const t = (v - 0.2) / transition;
        desert = 1 - t;
        plains = t;
    } else if (v < 0.4) { 
        // 0.3 - 0.4: Чистые равнины
        plains = 1;
    } else if (v < 0.4 + transition) {
        const t = (v - 0.4) / transition;
        plains = 1 - t;
        forest = t;
    } else if (v < 0.6) { 
        // 0.5 - 0.6: Чистый лес
        forest = 1;
    } else if (v < 0.6 + transition) {
        const t = (v - 0.6) / transition;
        forest = 1 - t;
        jungle = t;
    } else if (v < 0.8) { 
        // 0.7 - 0.8: Чистые джунгли
        jungle = 1;
    } else if (v < 0.8 + transition) {
        // 0.8 - 0.9: Плавный переход в зиму
        const t = (v - 0.8) / transition;
        jungle = 1 - t;
        snow = t;
    } else {
        // 0.9 - 1.0: Чистая зима (всего 10% диапазона)
        snow = 1; 
    }

    // Плавно вплавляем деревню, если шум высокий (например > 0.7)
if (villageNoise > 0.65) {
        const vt = Math.min(1, (villageNoise - 0.65) / 0.1); 
        village = vt;
        const invVt = 1 - vt;
        desert *= invVt; plains *= invVt; forest *= invVt; jungle *= invVt; snow *= invVt;
    }

    const level = GameState.corruptionLevel;
    if (level > 0) {
        const corruptionNoise = (fbm(x, { scale: 0.0003, octaves: 2, seed: WORLD_SEED + 666 }) + 1) / 2;
        const threshold = 0.95 - (level * 0.08); 
        if (corruptionNoise > threshold) {
            const ct = Math.min(1, (corruptionNoise - threshold) / 0.1);
            corruption = ct;
            const invCt = 1 - ct;
            desert *= invCt; plains *= invCt; forest *= invCt; jungle *= invCt; snow *= invCt; village *= invCt;
        }
    }

// --- ГИГАНТСКИЙ ОКЕАН (Агрессивное вливание) ---
    const oceanData = getOceanMix(x);
    if (oceanData.active) {
        const t = oceanData.weight; 
        
        if (t > 0) {
            // АГРЕССИВНО подавляем материк! 
            // Умножаем t на 5, чтобы лес и горы полностью исчезали сразу же на пляже
            const invOcean = Math.max(0, 1 - (t * 5));
            desert *= invOcean; plains *= invOcean; forest *= invOcean; 
            jungle *= invOcean; snow *= invOcean; village *= invOcean; corruption *= invOcean;
            
            // Искусственно "раздуваем" вес пляжа и океана, чтобы они 100% стали доминировать в getBiome()
            beach = oceanData.beach * t * 10;
            ocean = (oceanData.shallows + oceanData.deep) * t * 10; 
        }
    }

    return { desert, plains, forest, jungle, snow, village, corruption, beach, ocean };
}

export function getBiome(x) {
    const m = getBiomeMix(x);
    const maxWeight = Math.max(m.desert, m.plains, m.forest, m.jungle, m.snow, m.village, m.corruption || 0, m.beach || 0, m.ocean || 0);
    
    if (m.ocean === maxWeight) return "ocean";     // <-- НОВЫЙ БИОМ
    if (m.beach === maxWeight) return "beach";     // <-- НОВЫЙ БИОМ
    if (m.corruption === maxWeight) return "corruption";
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