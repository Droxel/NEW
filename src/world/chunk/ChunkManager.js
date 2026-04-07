//ChunkManager.js
import { Chunk } from "./Chunk.js";
import { GameState } from "../../core/GameState.js";
import { cameraX } from "../../core/Braw.js"; // Нам нужна камера, чтобы не менять деревья прям на глазах
import { CONFIG } from "../../data/config.js";

const CHUNK_SIZE = 1024;

export class ChunkManager {
    constructor(worldInstance){ 
        this.chunks = new Map();
        this.world = worldInstance; 
        this.mutationTimer = 0; // Таймер для мутации
    }

    getChunkId(x){
        return Math.floor(x / CHUNK_SIZE);
    }

    getChunk(x){
        const id = this.getChunkId(x);
        if(!this.chunks.has(id)){
            this.chunks.set(id, new Chunk(id, this.world)); 
        }
        return this.chunks.get(id);
    }

    preloadChunks(renderCamX, width) {
        const startChunk = this.getChunkId(renderCamX - width); 
        const endChunk = this.getChunkId(renderCamX + width);   

        for (let i = startChunk; i <= endChunk; i++) {
            this.getChunk(i * CHUNK_SIZE);
        }
    }

    // 👇 НОВЫЙ МЕТОД: Плавное заражение мира 👇
update(dt, player) {
    // 1. Твоя логика мутации деревьев (оставляем)
    const level = GameState.corruptionLevel;
    if (level > 0) {
        this.mutationTimer++;
        const mutationRate = level === 1 ? 120 : (level === 2 ? 60 : 30);
        if (this.mutationTimer >= mutationRate) {
            this.mutationTimer = 0;
            this.corruptRandomOffscreenTree();
        }
    }

    // 2. НОВАЯ ЛОГИКА: Обновляем только те чанки, которые видит игрок
    // Это заставит стражей в поле зрения проверять GameState
const startId = this.getChunkId(cameraX - 1000);
    const endId = this.getChunkId(cameraX + CONFIG.width + 1000);

    for (let id = startId; id <= endId; id++) {
        const chunk = this.chunks.get(id);
        if (chunk) chunk.update(dt, player); // <-- Передаем player в чанк
    }
}

    corruptRandomOffscreenTree() {
        const chunkIds = Array.from(this.chunks.keys());
        if (chunkIds.length === 0) return;

        // Выбираем случайный загруженный чанк
        const randomId = chunkIds[Math.floor(Math.random() * chunkIds.length)];
        const chunk = this.chunks.get(randomId);

        // Границы экрана с небольшим запасом
        const leftView = cameraX - 300;
        const rightView = cameraX + CONFIG.width + 300;
        const chunkStartX = randomId * CHUNK_SIZE;

        // Если чанк сейчас на экране - отменяем! (Игрок не должен видеть магию)
        if (chunkStartX + CHUNK_SIZE > leftView && chunkStartX < rightView) {
            return; 
        }

        // Ищем в этом чанке обычные деревья
        const normalTrees = chunk.objects.filter(obj => obj.type === "tree" && obj.imgKey !== "distorted_tree");
        
        if (normalTrees.length > 0) {
            // Берем случайное дерево и превращаем его в искаженное
            const treeToCorrupt = normalTrees[Math.floor(Math.random() * normalTrees.length)];
            treeToCorrupt.imgKey = "distorted_tree";
            // Можем чуть увеличить его для устрашения
            treeToCorrupt.width *= 1.1; 
            treeToCorrupt.height *= 1.1;
        }
    }
}