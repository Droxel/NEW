// src/world/world.js
import { getHeight as calculateTerrainHeight } from "./terrain/Height.js";
// Исправлено: добавлена точка перед /terrain
import { getBiome, getBiomeMix, isLargeBiome } from "./terrain/BiomeMap.js"; 
import { ChunkManager } from "./chunk/ChunkManager.js";
import { isWater, getWaterLevel, getWaterData } from "./Water.js";
import { DungeonGenerator } from "./structures/DungeonGenerator.js";
import { WORLD_SEED } from "./Seed.js"

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
        // ЗАМЕНЯЕМ ВСЕ ПРОВЕРКИ НА ОДНУ:
        // Спрашиваем напрямую у генератора, будет ли он там спавнить структуру
        if (world.dungeonGenerator && world.dungeonGenerator.shouldSpawnDungeon(dungeonCenter, world)) {
            return terrainHeight + abyssDepth;
        }
    }
    
    return terrainHeight;
}

// 2. ДОБАВЛЯЕМ dungeonGenerator В ОБЪЕКТ
export const world = {
    seed: WORLD_SEED, // ДОБАВИТЬ ЭТО
    getHeight,
    getBiome,
    getBiomeMix,
    isWater,
    getWaterLevel,
    getWaterData,
    chunkManager: null,
    dungeonGenerator: new DungeonGenerator()
};

world.chunkManager = new ChunkManager(world);