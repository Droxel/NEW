// src/world/Water.js
import { world } from "./World.js";
import { getOceanWaterData } from "./Ocean.js";
import { calculateOceanTerrain } from "./Ocean.js";
import { getHeight as calculateTerrainHeight } from "./terrain/Height.js";
// Твой идеальный кэш
const regionCache = new Map();
function getInternalBaseHeight(x) {
    // 💥 ИСПРАВЛЕНИЕ: Возвращаем чистую высоту, океан уже применен внутри Height.js
    return calculateTerrainHeight(x);
}
function calculateLake(x) {
    const STEP = 50;
    const MAX_DIST = 4000;
    const BOWL_TOLERANCE = 80;

    let startY = world.getBaseHeight(x);

    // 1. Ищем левый край
    let leftPeakY = startY;
    let leftPeakX = x;
    let foundLeftRim = false;
    for (let scanX = x; scanX > x - MAX_DIST; scanX -= STEP) {
        let y = world.getBaseHeight(scanX);
        if (y < leftPeakY) {
            leftPeakY = y;
            leftPeakX = scanX;
        } else if (y > leftPeakY + BOWL_TOLERANCE) { 
            foundLeftRim = true;
            break;
        }
    }

    // 2. Ищем правый край
    let rightPeakY = startY;
    let rightPeakX = x;
    let foundRightRim = false;
    for (let scanX = x; scanX < x + MAX_DIST; scanX += STEP) {
        let y = world.getBaseHeight(scanX);
        if (y < rightPeakY) {
            rightPeakY = y;
            rightPeakX = scanX;
        } else if (y > rightPeakY + BOWL_TOLERANCE) {
            foundRightRim = true;
            break;
        }
    }

    if (!foundLeftRim || !foundRightRim) return null;

    let waterLevelY = Math.max(leftPeakY, rightPeakY) + 10;

    // 4. Трассируем точные границы
    let exactLeftX = leftPeakX;
    while(world.getBaseHeight(exactLeftX) < waterLevelY && exactLeftX < x) exactLeftX += 5;
    let exactRightX = rightPeakX;
    while(world.getBaseHeight(exactRightX) < waterLevelY && exactRightX > x) exactRightX -= 5;

    if (exactRightX - exactLeftX < 150) return null;
    
    let lowestY = startY;
    for (let cx = exactLeftX; cx <= exactRightX; cx += 20) {
        lowestY = Math.max(lowestY, world.getBaseHeight(cx));
    }
    if (lowestY - waterLevelY < 40) return null;

    return { leftX: exactLeftX, rightX: exactRightX, level: waterLevelY };
}

export function getWaterData(x, y) {
    // Используем нашу внутреннюю функцию вместо world.getBaseHeight
    const currentGroundY = getInternalBaseHeight(x);
    
    const ocean = getOceanWaterData(x, y, currentGroundY);
    
    if (ocean.isWater) {
        // Проверка для отрисовки (y не передан)
        if (y === undefined || y === null) {
            return { 
                isWater: true, 
                level: ocean.level, 
                bottom: ocean.bottom, 
                isOcean: true,
                depthFactor: ocean.depthFactor 
            };
        }
        // Проверка для физики (y передан)
        if (ocean.inWater) {
            return { isWater: true, level: ocean.level, bottom: ocean.bottom, isOcean: true };
        }
        return { isWater: false };
    }
    // --- 2. ПРОВЕРЯЕМ ТВОИ ИДЕАЛЬНЫЕ ОЗЕРА ЧЕРЕЗ КЭШ ---
    const REGION_SIZE = 50;
    const region = Math.floor(x / REGION_SIZE);

    if (!regionCache.has(region)) {
        let lake = calculateLake(x);
        regionCache.set(region, lake || false);

        if (lake) {
            let startR = Math.floor(lake.leftX / REGION_SIZE);
            let endR = Math.floor(lake.rightX / REGION_SIZE);
            for(let r = startR; r <= endR; r++) {
                regionCache.set(r, lake);
            }
        }
        if (regionCache.size > 2000) regionCache.clear();
    }

    const lakeData = regionCache.get(region);

    // Если озера нет или мы вышли за его границы X
    if (!lakeData || x < lakeData.leftX || x > lakeData.rightX) {
        return { isWater: false, level: null };
    }

    const groundY = world.getBaseHeight(x);

    // Если y не передан — это запрос от Braw.js для отрисовки поверхности
    if (y === undefined || y === null) {
        return { isWater: true, level: lakeData.level, bottom: groundY, isOcean: false };
    }

    // Если y передан — это проверка физики (в воде ли объект)
    if (y >= lakeData.level && y <= (groundY + 10)) {
        return { isWater: true, level: lakeData.level, bottom: groundY, isOcean: false };
    }

    return { isWater: false, level: null };
}

export function isWater(x, y) {
    if (y === undefined || y === null) return false; 
    return getWaterData(x, y).isWater;
}

export function getWaterLevel(x) {
    const data = getWaterData(x);
    return data.isWater ? data.level : null;
}