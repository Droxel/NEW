//ChunkManager.js
import { Chunk } from "./Chunk.js";

const CHUNK_SIZE = 1024;

export class ChunkManager {
    constructor(worldInstance){ 
        this.chunks = new Map();
        this.world = worldInstance; // Сохраняем мир здесь
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
}
