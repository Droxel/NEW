// VillageGenerator.js
import { VillageAssembler } from "./village/VillageAssembler.js";
import { residentManager } from "../../entities/npcs/residents/ResidentManager.js"; // <--- ДОБАВИТЬ ЭТО

export class VillageGenerator {
    constructor() {
        this.villages = new Map();
    }

    getVillageBlocksForChunk(chunkX, chunkWidth, world) {
        const blocks = [];
        const step = 2000; 
        
        for (let x = chunkX; x < chunkX + chunkWidth; x += 100) {
            if (world.getBiome(x) === "village") {
                const villageId = Math.floor(x / step);
                
                if (!this.villages.has(villageId)) {
                    const seed = (world.seed || 12345) + villageId;
                    const layoutData = VillageAssembler.generateLayout(seed);
                    
                    const startX = (villageId * step) + (step / 2) - (layoutData.totalWidth / 2);
                    const endX = startX + layoutData.totalWidth;

                    // --- УСИЛЕННАЯ ПРОВЕРКА БИОМА ---
                    let isSpaceValid = true;
                    
                    // Проверяем точки через каждые 150 пикселей по всей длине деревни
                    for (let checkX = startX; checkX <= endX; checkX += 150) {
                        if (world.getBiome(checkX) !== "village") {
                            isSpaceValid = false;
                            break;
                        }
                    }
                    
                    // Финальная проверка конца на всякий случай
                    if (world.getBiome(endX) !== "village") isSpaceValid = false;

                    if (!isSpaceValid) {
                        // Если хотя бы одна точка не в биоме деревни — отменяем весь спавн
                        continue; 
                    }

                    // 2. Проверка на воду
                    if (world.isWater(startX) || world.isWater(endX) || world.isWater(startX + layoutData.totalWidth / 2)) {
                        continue; 
                    }

                    // 3. Проверка ландшафта
                    const yStart = world.getHeight(startX, true);
                    const yMid = world.getHeight(startX + layoutData.totalWidth / 2, true);
                    const yEnd = world.getHeight(endX, true);
                    const maxDiff = Math.max(Math.abs(yStart - yEnd), Math.abs(yStart - yMid), Math.abs(yMid - yEnd));
                    
if (maxDiff > 150) {
                        continue; 
                    }

                    this.villages.set(villageId, { startX, data: layoutData.objects });
                    console.log(`🏠 Деревня создана строго в своем биоме на X: ${Math.round(startX)}`);
                    
                    // --- НОВОЕ: СПАВН ЖИТЕЛЕЙ ---
                    // Передаем координаты стен (startX и endX) и массив объектов (чтобы посчитать дома)
                    residentManager.spawnForVillage(startX, endX, layoutData.objects);
                    // ----------------------------
                }
            }
        }

// Рендеринг блоков
        this.villages.forEach((village) => {
            const chunkEndX = chunkX + chunkWidth;
            village.data.forEach(obj => {
                const worldX = village.startX + obj.offsetX;
                if (worldX + obj.width >= chunkX && worldX < chunkEndX) {
                    const yLeft = world.getHeight(worldX, true);
                    const yRight = world.getHeight(worldX + obj.width, true);
                    const yCenter = world.getHeight(worldX + obj.width / 2, true);
                    const groundY = Math.max(yLeft, yRight, yCenter); 
                    const offsetDown = obj.yOffset !== undefined ? obj.yOffset : 35;

                    // --- НОВОЕ: ПРИНУДИТЕЛЬНАЯ КОЛЛИЗИЯ ДЛЯ КОЛОНН ---
                    let isSolid = obj.hasCollision || false;
                    
                    // Если в названии картинки есть слово column, wall, stena и т.д.
                    // (замени на свое название ключа картинки колонны, если оно другое)
                    if (obj.imgKey && (obj.imgKey.includes("column") || obj.imgKey.includes("wall"))) {
                        isSolid = true;
                    }

                    blocks.push({
                        type: obj.type,
                        x: worldX,
                        y: groundY - obj.height + offsetDown, 
                        width: obj.width,
                        height: obj.height,
                        imgKey: obj.imgKey,
                        hasCollision: isSolid // Передаем наш флажок
                    });
                }
            });
        });

        return blocks;
    }
}