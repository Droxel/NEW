// src/world/World.js
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

export const world = {
    seed: WORLD_SEED,
    chunkManager: null,
    dungeonGenerator: new DungeonGenerator(),
    corruptionManager: new CorruptionManager(),

    // --- НОВОЕ API ВЫСОТ ---

    // 1. Чистая высота рельефа (используется для воды, биомов и генерации поверхности)
    getBaseHeight(x) {
        return calculateTerrainHeight(x);
    },

    // 2. Финальная высота мира с учетом структур, ям и данжей (используется физикой)
    getFinalHeight(x) {
        const terrainHeight = this.getBaseHeight(x);
        
        const dungeonCenter = Math.round((x - DUNGEON_OFFSET) / DUNGEON_SPACING) * DUNGEON_SPACING + DUNGEON_OFFSET;
        const distToCenter = Math.abs(x - dungeonCenter);
        const dungeonZoneWidth = 80; 
        const abyssDepth = 20000; 

        if (distToCenter < dungeonZoneWidth) {
            if (this.dungeonGenerator && this.dungeonGenerator.shouldSpawnDungeon(dungeonCenter, this)) {
                return terrainHeight + abyssDepth; 
            }
        }
        return terrainHeight;
    },

    // 3. Совместимость со старым кодом (рекомендуется плавно переходить на getFinal/getBase)
    getHeight(x, returnOriginal = false) {
        return returnOriginal ? this.getBaseHeight(x) : this.getFinalHeight(x);
    },

    // --- ОСТАЛЬНЫЕ МЕТОДЫ ---

    getBiome,
    getBiomeMix,
    isWater,
    getWaterLevel,
    getWaterData,

    // Функция замены статуй на алтари
    replaceStatuesWithAltars(bossKey) {
        if (!this.chunkManager) return;

        for (const [chunkId, chunk] of this.chunkManager.chunks.entries()) {
            if (!chunk.statues) continue;

            for (let i = 0; i < chunk.statues.length; i++) {
                const obj = chunk.statues[i];

                if (obj.type !== "altar" && obj.config && obj.config.bossKey === bossKey) {
                    console.log(`🗿 Статуя ${bossKey} в чанке ${chunkId} заменена на Алтарь`);
                    
                    // БЕРЕМ ФИНАЛЬНУЮ ВЫСОТУ ДЛЯ СПАВНА ОБЪЕКТА
                    const groundY = this.getFinalHeight(obj.x); 
                    chunk.statues[i] = new Altar(obj.x, groundY + 50, bossKey);
                }
            }
        }
    }
};

world.chunkManager = new ChunkManager(world);