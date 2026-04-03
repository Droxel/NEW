// src/world/structures/village/VillageAssembler.js
import { VillageAssets } from '../../../data/villageBlueprints.js';

export class VillageAssembler {
    static generateLayout(seed) {
        let currentSeed = seed;
        const random = () => {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        };

        const layout = [];
        
        // Проверка на наличие данных (чтобы не упасть сразу)
        if (!VillageAssets || !VillageAssets.wall) {
            console.error("❌ VillageAssets.wall не найден! Проверь импорт в VillageAssembler.");
            return { objects: [], totalWidth: 0 };
        }

        const buildingsCount = Math.floor(random() * 8) + 4; 
        let cursorX = 0;

        // 1. ЛЕВАЯ КОЛОННА
        layout.push({
            ...VillageAssets.wall,
            offsetX: cursorX,
            type: 'village_wall'
        });
        cursorX += (VillageAssets.wall.width || 250) + 60;

        // 2. ВНУТРЕННОСТИ ДЕРЕВНИ
        for (let i = 0; i < buildingsCount; i++) {
            const isHouse = random() > 0.4; 
            const pool = isHouse ? VillageAssets.houses : VillageAssets.decor;
            
            // Защита: если массив пуст или не найден
            if (!pool || pool.length === 0) {
                console.warn(`⚠️ Внимание: Массив ${isHouse ? 'houses' : 'decor'} пуст в villageBlueprints.js!`);
                continue; // Пропускаем эту итерацию
            }

            const blueprint = pool[Math.floor(random() * pool.length)];
            
            // Финальная проверка самого объекта
            if (!blueprint) continue;

            layout.push({
                ...blueprint,
                offsetX: cursorX,
                type: isHouse ? 'village_house' : 'village_decor'
            });
            
            // Используем || 100 на случай, если width забыли прописать
            cursorX += (blueprint.width || 100) + 30 + (random() * 50); 
        }

        // 3. ПРАВАЯ КОЛОННА
        layout.push({
            ...VillageAssets.wall,
            offsetX: cursorX,
            type: 'village_wall'
        });

        const totalWidth = cursorX + (VillageAssets.wall.width || 250);

        return {
            objects: layout,
            totalWidth: totalWidth
        };
    }
}