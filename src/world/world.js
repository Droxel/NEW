// src/world/world.js
import { getHeight as calculateTerrainHeight } from "./terrain/height.js";
import { getBiome, getBiomeMix, isLargeBiome } from "./terrain/biomeMap.js"; 
import { ChunkManager } from "./chunk/ChunkManager.js";
import { isWater, getWaterLevel, getWaterData } from "./water.js";
// 1. ИМПОРТИРУЕМ ГЕНЕРАТОР
import { DungeonGenerator } from "./structures/DungeonGenerator.js";

const DUNGEON_SPACING = 15000; 
const DUNGEON_OFFSET = 5500; 

function getHeight(x, returnOriginal = false) {
    const terrainHeight = calculateTerrainHeight(x);
    if (returnOriginal) return terrainHeight;

    const dungeonCenter = Math.round((x - DUNGEON_OFFSET) / DUNGEON_SPACING) * DUNGEON_SPACING + DUNGEON_OFFSET;
    const distToCenter = Math.abs(x - dungeonCenter);
    const dungeonZoneWidth = 80; 
    const abyssDepth = 20000; 

    if (distToCenter < dungeonZoneWidth) {
        const biome = getBiome(dungeonCenter);
        if (biome === 'jungle' && isLargeBiome(dungeonCenter, "jungle", 600)) {
            return terrainHeight + abyssDepth;
        }
    }
    return terrainHeight;
}

// 2. ДОБАВЛЯЕМ dungeonGenerator В ОБЪЕКТ
export const world = {
    getHeight,
    getBiome,
    getBiomeMix,
    isWater,
    getWaterLevel,
    getWaterData,
    chunkManager: null,
    dungeonGenerator: new DungeonGenerator() // <--- ТЕПЕРЬ ОН ТУТ ЕСТЬ
};

world.chunkManager = new ChunkManager(world);