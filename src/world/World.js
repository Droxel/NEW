// src/world/world.js
import { getHeight as calculateTerrainHeight } from "./terrain/Height.js";
import { getBiome, getBiomeMix, isLargeBiome } from "./terrain/BiomeMap.js"; 
import { ChunkManager } from "./chunk/ChunkManager.js";
import { isWater, getWaterLevel, getWaterData } from "./Water.js";
import { DungeonGenerator } from "./structures/DungeonGenerator.js";
import { WORLD_SEED } from "./Seed.js"
import { CorruptionManager } from "./CorruptionManager.js";
import { Altar } from "./objects/Altar.js";

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
        // Спрашиваем напрямую у генератора, будет ли он там спавнить структуру
        if (world.dungeonGenerator && world.dungeonGenerator.shouldSpawnDungeon(dungeonCenter, world)) {
            return terrainHeight + abyssDepth;
        }
    }
    
    return terrainHeight;
}

export const world = {
    seed: WORLD_SEED,
    getHeight,
    getBiome,
    getBiomeMix,
    isWater,
    getWaterLevel,
    getWaterData,
    chunkManager: null,
    dungeonGenerator: new DungeonGenerator(),
    corruptionManager: new CorruptionManager(),

    // Функция замены статуй на алтари
    replaceStatuesWithAltars(bossKey) {
        if (!this.chunkManager) return;

        for (const [chunkId, chunk] of this.chunkManager.chunks.entries()) {
            if (!chunk.statues) continue;

            for (let i = 0; i < chunk.statues.length; i++) {
                const obj = chunk.statues[i];

                if (obj.type !== "altar" && obj.config && obj.config.bossKey === bossKey) {
                    console.log(`🗿 Статуя ${bossKey} в чанке ${chunkId} заменена на Алтарь`);
                    
                    // БЕРЕМ ТОЧНУЮ ВЫСОТУ ЗЕМЛИ ДЛЯ АЛТАРЯ
                    const groundY = this.getHeight(obj.x); 
                    chunk.statues[i] = new Altar(obj.x, groundY + 50, bossKey);
                }
            }
        }
    }
};

world.chunkManager = new ChunkManager(world);