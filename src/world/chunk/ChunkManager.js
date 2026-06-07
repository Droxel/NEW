//ChunkManager.js
import { Chunk } from "./Chunk.js";
import { GameState } from "../../core/GameState.js";
import { cameraX, zoomLevel } from "../../core/Braw.js";
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

update(dt, player) {
    const level = GameState.corruptionLevel;
    if (level > 0) {
        this.mutationTimer++;
        const mutationRate = level === 1 ? 120 : (level === 2 ? 60 : 30);
        if (this.mutationTimer >= mutationRate) {
            this.mutationTimer = 0;
            this.corruptRandomOffscreenTree();
        }
    }

    // Рассчитываем видимую область
    const visibleWidth = CONFIG.width / zoomLevel; 
    
    // Берем запас побольше (например, 1500 вместо 1000), 
    // чтобы объекты на краях не «замерзали» при отдалении
    const buffer = 1500 / zoomLevel; 
    
    const startId = this.getChunkId(cameraX - buffer);
    const endId = this.getChunkId(cameraX + visibleWidth + buffer);

    for (let id = startId; id <= endId; id++) {
        const chunk = this.chunks.get(id);
        if (chunk) {
            chunk.update(dt, player);
        } else {
            // Если чанка нет в Map, создаем его (подгрузка на ходу)
            this.getChunk(id * CHUNK_SIZE);
        }
    }
}

corruptRandomOffscreenTree() {
        const chunkIds = Array.from(this.chunks.keys());
        if (chunkIds.length === 0) return;

        const randomId = chunkIds[Math.floor(Math.random() * chunkIds.length)];
        const chunk = this.chunks.get(randomId);

        // Границы экрана с запасом и учетом зума
        const visibleWidth = CONFIG.width / zoomLevel; 
        const leftView = cameraX - 300;
        const rightView = cameraX + visibleWidth + 300;
        const chunkStartX = randomId * CHUNK_SIZE;

        // Если чанк сейчас на экране - отменяем!
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