// src/world/Water.js
import { getLakeIntensity } from "./Seed.js"; 
import { getHeight } from "./terrain/Height.js";
// Уровень воды фиксируем.
// Важно: он должен совпадать с логикой в height.js, где мы копаем яму.
const WATER_SURFACE_LEVEL = 450; 

export function getWaterData(x) {
    // 1. Спрашиваем у ядра генерации: "Здесь вообще есть зона влияния озера?"
    const lakeFactor = getLakeIntensity(x);

    // Если влияния озера нет совсем (даже малейшего) — воды нет.
    // Ставим очень маленький порог, чтобы вода не обрывалась резко.
    if (lakeFactor <= 0.001) {
        return { isWater: false, level: null };
    }

    // 2. Получаем высоту земли в этой точке
    const groundHeight = getHeight(x);

    // 3. ФИЗИЧЕСКАЯ ПРОВЕРКА (Самая главная)
    // В Canvas Y растет вниз. 
    // Если groundHeight (дно) > WATER_SURFACE_LEVEL (поверхность), значит дно НИЖЕ уровня воды.
    // Значит, здесь есть вода.
    if (groundHeight > WATER_SURFACE_LEVEL) {
        return {
            isWater: true,
            level: WATER_SURFACE_LEVEL 
        };
    }

    // Если земля выше уровня воды (мы на берегу) — воды нет.
    return { isWater: false, level: null };
}

export function isWater(x) {
    return getWaterData(x).isWater;
}

export function getWaterLevel(x) {
    return getWaterData(x).level;
}