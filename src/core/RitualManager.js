// src/core/RitualManager.js

export class RitualManager {
    constructor() {
        this.screenShake = 0; // Сила глобальной тряски экрана
    }

    update(dt, world) {
        // Гасим тряску экрана со временем
        if (this.screenShake > 0) {
            this.screenShake -= 15 * dt; 
            if (this.screenShake < 0) this.screenShake = 0;
        }

        if (!world.chunkManager) return;

        // Перебираем все чанки и ищем в них статуи/алтари
        for (const [chunkId, chunk] of world.chunkManager.chunks.entries()) {
            if (chunk.statues) {
                for (let obj of chunk.statues) {
                    // Если объект - это Алтарь (у него есть метод update), обновляем его
                    if (obj.update && typeof obj.update === 'function') {
                        obj.update(dt);
                    }
                }
            }
        }
    }
}

export const ritualManager = new RitualManager();