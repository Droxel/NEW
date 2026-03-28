// src/world/Water.js
import { getLakeIntensity } from "./Seed.js"; 
import { getHeight, getShoreHeight } from "./terrain/Height.js";

// Используем Map для надежного кэширования по границам ямы
const lakeCache = new Map();

function getLakeBoundsAndLevel(currentX) {
    // 1. Привязываем поиск к жесткой сетке (шаг 20)
    const STEP = 20;
    const gridX = Math.floor(currentX / STEP) * STEP;

    // 2. Ищем левый край ямы (идем влево, пока интенсивность не станет 0)
    let leftX = gridX;
    while (getLakeIntensity(leftX) > 0) { leftX -= STEP; }

    // 3. Ищем правый край ямы (идем вправо, пока интенсивность не станет 0)
    let rightX = gridX;
    while (getLakeIntensity(rightX) > 0) { rightX += STEP; }

    // Теперь у нас есть УНИКАЛЬНЫЙ ключ этой ямы (например: "1240_1860")
    const lakeKey = `${leftX}_${rightX}`;

    // Если мы уже считали ЭТУ яму, просто берем её уровень из кэша
    if (lakeCache.has(lakeKey)) {
        return lakeCache.get(lakeKey);
    }

    // 4. Узнаем высоту земли на найденных берегах (БЕЗ учета ямы)
    const leftShoreY = getShoreHeight(leftX);
    const rightShoreY = getShoreHeight(rightX);

    // 5. Железобетонное правило: вода наливается до самого низкого берега
    // (В Canvas Y идет вниз, поэтому "низкий" берег = большее значение Y)
    let flatLevel = Math.max(leftShoreY, rightShoreY);

    // Опускаем воду чуть-чуть ниже края берега, чтобы она не переливалась за край
    flatLevel += 10; 

    const lakeData = { leftX, rightX, level: flatLevel };
    
    // Защита от переполнения памяти
    if (lakeCache.size > 50) {
        const firstKey = lakeCache.keys().next().value;
        lakeCache.delete(firstKey);
    }
    
    lakeCache.set(lakeKey, lakeData);
    return lakeData;
}

export function getWaterData(x) {
    // Если в этой точке вообще нет ямы озера, воды тут нет 100%
    if (getLakeIntensity(x) <= 0) {
        return { isWater: false, level: null };
    }

    // Получаем точные границы и ровный уровень воды для этой конкретной ямы
    const lakeData = getLakeBoundsAndLevel(x);
    const waterSurface = lakeData.level;
    const groundY = getHeight(x); 

    // ЖЕЛЕЗОБЕТОННАЯ ПРОВЕРКА:
    // 1. Мы находимся строго внутри ямы (между берегами)
    // 2. Дно в этой точке находится НИЖЕ поверхности воды (Y дна > Y воды)
    if (x >= lakeData.leftX && x <= lakeData.rightX && groundY > waterSurface) {
        return {
            isWater: true,
            level: waterSurface 
        };
    }

    return { isWater: false, level: null };
}

export function isWater(x) {
    return getWaterData(x).isWater;
}

export function getWaterLevel(x) {
    return getWaterData(x).level;
}