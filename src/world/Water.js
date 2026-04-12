// src/world/Water.js
import { world } from "./World.js";

// Кэшируем зоны (по 50px), чтобы не пересчитывать тяжелый радар каждый кадр
const regionCache = new Map();

function calculateLake(x) {
    const STEP = 50;         // Шаг радара (перешагиваем мелкие кочки)
    const MAX_DIST = 4000;   // Максимальный размер озера в одну сторону
    const BOWL_TOLERANCE = 80; // Насколько пикселей должна упасть земля за горой, чтобы мы признали её краем

    // ИСПОЛЬЗУЕМ БАЗОВУЮ ВЫСОТУ (БЕЗ ДАНЖЕЙ)
    let startY = world.getBaseHeight(x);

    // 1. Ищем левый край (пик горы слева)
    let leftPeakY = startY;
    let leftPeakX = x;
    let foundLeftRim = false;

    for (let scanX = x; scanX > x - MAX_DIST; scanX -= STEP) {
        let y = world.getBaseHeight(scanX);
        if (y < leftPeakY) { // Земля идет вверх (Y уменьшается)
            leftPeakY = y;
            leftPeakX = scanX;
        } else if (y > leftPeakY + BOWL_TOLERANCE) { 
            // Земля резко ушла вниз после пика -> мы нашли левый край чаши!
            foundLeftRim = true;
            break;
        }
    }

    // 2. Ищем правый край (пик горы справа)
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

    // Если нет стенок с обеих сторон — это не впадина, а просто склон или равнина
    if (!foundLeftRim || !foundRightRim) return null;

    // 3. Уровень воды — по самому низкому из двух берегов
    let waterLevelY = Math.max(leftPeakY, rightPeakY);
    waterLevelY += 10; // Чуть-чуть опускаем, чтобы не было визуальных переливов

    // 4. Трассируем ТОЧНЫЕ границы берегов (чтобы вода идеально касалась земли)
    let exactLeftX = leftPeakX;
    while(world.getBaseHeight(exactLeftX) < waterLevelY && exactLeftX < x) exactLeftX += 5;

    let exactRightX = rightPeakX;
    while(world.getBaseHeight(exactRightX) < waterLevelY && exactRightX > x) exactRightX -= 5;

    // 5. Фильтрация луж (слишком узкие или мелкие игнорируем)
    if (exactRightX - exactLeftX < 150) return null;
    
    let lowestY = startY;
    for (let cx = exactLeftX; cx <= exactRightX; cx += 20) {
        lowestY = Math.max(lowestY, world.getBaseHeight(cx));
    }
    if (lowestY - waterLevelY < 40) return null;

    return {
        leftX: exactLeftX,
        rightX: exactRightX,
        level: waterLevelY
    };
}

export function getWaterData(x, y) {
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

    // 1. Если озера в этих координатах X нет — сразу выходим
    if (!lakeData || x < lakeData.leftX || x > lakeData.rightX) {
        return { isWater: false, level: null };
    }

    // 2. Получаем реальное дно (ИСПОЛЬЗУЕМ БАЗОВУЮ ВЫСОТУ, без учета бездны данжей)
    const groundY = world.getBaseHeight(x);

    // 3. ПРОВЕРКА ВЫСОТЫ
    if (y === undefined || y === null) {
        return { isWater: true, level: lakeData.level, bottom: groundY };
    }

    // Объект в воде ТОЛЬКО если его Y между поверхностью озера и реальным дном
    if (y >= lakeData.level && y <= (groundY + 10)) {
        return { isWater: true, level: lakeData.level, bottom: groundY };
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