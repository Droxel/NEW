//StructureManager.js
import { DungeonGenerator } from "./DungeonGenerator.js";
import { VillageGenerator } from "./VillageGenerator.js"; // Если есть, иначе можно убрать

export const StructureManager = {
    dungeonGenerator: new DungeonGenerator(),
    villageGenerator: new VillageGenerator(), // Заглушка, если файл пустой

    generateStructuresForChunk(chunk, world) {
        const chunkX = chunk.id * 1024; // CHUNK_SIZE из ChunkManager
        const chunkWidth = 1024;

        // 1. Генерация Данжей
        const dungeonBlocks = this.dungeonGenerator.getDungeonBlocksForChunk(chunkX, chunkWidth, world);
        
        // Добавляем блоки данжа в объекты чанка
        // Важно добавить их в НАЧАЛО массива objects, чтобы они рисовались ПОЗАДИ деревьев и игрока (если background)
        // Или разделить на слои. Пока кидаем всё в objects.
        
        dungeonBlocks.forEach(block => {
            chunk.objects.push(block);
        });
    }
};