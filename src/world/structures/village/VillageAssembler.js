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
        const buildingsCount = Math.floor(random() * 8) + 4; // От 4 до 11 построек внутри
        
        let cursorX = 0;

        // 1. ЛЕВАЯ КОЛОННА (Замыкает слева)
        layout.push({
            ...VillageAssets.wall,
            offsetX: cursorX,
            type: 'village_wall'
        });
        cursorX += VillageAssets.wall.width + 60; // Отступ от левой стены до первого дома

        // 2. ВНУТРЕННОСТИ ДЕРЕВНИ
        for (let i = 0; i < buildingsCount; i++) {
            const isHouse = random() > 0.4; 
            const pool = isHouse ? VillageAssets.houses : VillageAssets.decor;
            const blueprint = pool[Math.floor(random() * pool.length)];
            
            layout.push({
                ...blueprint,
                offsetX: cursorX,
                type: isHouse ? 'village_house' : 'village_decor'
            });
            
            // Динамический отступ между зданиями (от 30 до 80 пикселей)
            cursorX += blueprint.width + 30 + (random() * 50); 
        }

        // 3. ПРАВАЯ КОЛОННА (Замыкает справа)
        layout.push({
            ...VillageAssets.wall,
            offsetX: cursorX,
            type: 'village_wall'
        });

        // Итоговая ширина всей конструкции (включая правую колонну)
        const totalWidth = cursorX + VillageAssets.wall.width;

        return {
            objects: layout,
            totalWidth: totalWidth
        };
    }
}