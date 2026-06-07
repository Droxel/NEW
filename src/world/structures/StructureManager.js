//StructureManager.js
import { DungeonGenerator } from "./DungeonGenerator.js";
import { VillageGenerator } from "./VillageGenerator.js";

export const StructureManager = {
    dungeonGenerator: new DungeonGenerator(),
    villageGenerator: new VillageGenerator(),

    generateStructuresForChunk(chunk, world) {
        const chunkX = chunk.id * 1024;
        const chunkWidth = 1024;

        // 1. Генерация Данжей
        const dungeonBlocks = this.dungeonGenerator.getDungeonBlocksForChunk(chunkX, chunkWidth, world);
        dungeonBlocks.forEach(block => {
            chunk.objects.push(block);
        });

        // 2. Генерация Деревень (НОВОЕ)
        const villageBlocks = this.villageGenerator.getVillageBlocksForChunk(chunkX, chunkWidth, world);
        villageBlocks.forEach(block => {
            chunk.objects.push(block);
        });
    }
};