// src/world/Water.js
import { getHeight } from "./terrain/Height.js";

// Кэшируем зоны (по 50px), чтобы не пересчитывать тяжелый радар каждый кадр
const regionCache = new Map();

function calculateLake(x) {
    const STEP = 50;         // Шаг радара (перешагиваем мелкие кочки)
    const MAX_DIST = 4000;   // Максимальный размер озера в одну сторону
    const BOWL_TOLERANCE = 80; // Насколько пикселей должна упасть земля за горой, чтобы мы признали её краем (бортиком)

    let startY = getHeight(x);

    // 1. Ищем левый край (пик горы слева)
    let leftPeakY = startY;
    let leftPeakX = x;
    let foundLeftRim = false;

    for (let scanX = x; scanX > x - MAX_DIST; scanX -= STEP) {
        let y = getHeight(scanX);
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
        let y = getHeight(scanX);
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
    while(getHeight(exactLeftX) < waterLevelY && exactLeftX < x) exactLeftX += 5;

    let exactRightX = rightPeakX;
    while(getHeight(exactRightX) < waterLevelY && exactRightX > x) exactRightX -= 5;

    // 5. Фильтрация луж (слишком узкие или мелкие игнорируем)
    if (exactRightX - exactLeftX < 150) return null;
    
    let lowestY = startY;
    for (let cx = exactLeftX; cx <= exactRightX; cx += 20) {
        lowestY = Math.max(lowestY, getHeight(cx));
    }
    if (lowestY - waterLevelY < 40) return null;

    return {
        leftX: exactLeftX,
        rightX: exactRightX,
        level: waterLevelY
    };
}

export function getWaterData(x) {
    const REGION_SIZE = 50;
    const region = Math.floor(x / REGION_SIZE);

    if (!regionCache.has(region)) {
        let lake = calculateLake(x);
        regionCache.set(region, lake || false);
        
        // Если нашли озеро, кэшируем сразу ВСЕ его зоны, чтобы не считать заново
        if (lake) {
            let startR = Math.floor(lake.leftX / REGION_SIZE);
            let endR = Math.floor(lake.rightX / REGION_SIZE);
            for(let r = startR; r <= endR; r++) {
                regionCache.set(r, lake);
            }
        }

        // Очистка старого кэша для оптимизации памяти
        if (regionCache.size > 2000) regionCache.clear();
    }

    let lakeData = regionCache.get(region);

    if (lakeData && x >= lakeData.leftX && x <= lakeData.rightX) {
        const groundY = getHeight(x);
        // Рисуем воду только если реальная земля ниже уровня воды
        if (groundY > lakeData.level) {
            return { isWater: true, level: lakeData.level };
        }
    }

    return { isWater: false, level: null };
}

export function isWater(x) {
    return getWaterData(x).isWater;
}

export function getWaterLevel(x) {
    return getWaterData(x).level;
}