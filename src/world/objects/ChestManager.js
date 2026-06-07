// src/world/objects/ChestManager.js
import { hash, WORLD_SEED } from "../Seed.js";
import { Chest } from "./Chest.js";
import { JungleChest } from "./JungleChest.js"; // <-- ИМПОРТИРУЕМ НАШ НОВЫЙ СУНДУК
import { LifeBushManager } from "./LifeBushManager.js";

export class ChestManager {
    static generateChestsForChunk(chunk, world) {
        const startX = chunk.id * 1024;
        const endX = startX + 1024;
        const SPACING = 150; 
        const BLOCK_SIZE = 40;

        // --- 1. СПАВН СУНДУКОВ В ДАНЖЕ ---
        this.spawnDungeonChests(chunk, world, startX, endX, BLOCK_SIZE);

        // --- 2. СПАВН ОБЫЧНЫХ СУНДУКОВ НА ПОВЕРХНОСТИ (Твой старый код не тронут!) ---
        let x = Math.ceil(startX / SPACING) * SPACING;

        while (x < endX) {
            const chance = hash(x + WORLD_SEED + 112233);
            
            if (chance > 0.96) {
                // Чтобы не спавнить обычные сундуки прямо в яме данжа, можно добавить простую проверку:
                // Но пока оставляем твой оригинальный рабочий код как есть.
                if (!world.isWater(x)) {
                    const jitter = (hash(x * 2) - 0.5) * 40; 
                    const finalX = x + jitter;
                    const chestWidth = 40;

                    const chestIndex = Math.floor(finalX / SPACING); 

                    const leftY = world.getHeight(finalX);
                    const rightY = world.getHeight(finalX + chestWidth);
                    const centerX = world.getHeight(finalX + chestWidth / 2);
                    const diff = Math.abs(leftY - rightY);
                    const slopeThreshold = 3; 

                    if (diff <= slopeThreshold) {
                        const groundY = Math.max(leftY, rightY, centerX);
                        const visualY = (groundY + 30) - 35; 

                        const chest = new Chest(finalX, visualY, chestIndex);
                        
                        chunk.objects.push({
                            type: "chest", // Для рендеринга
                            instance: chest,
                            x: chest.x,
                            y: chest.y,
                            width: chest.width,
                            height: chest.height,
                            zIndex: 1 
                        });
                    }
                }
            }
            x += SPACING;
        }

        LifeBushManager.generateBushesForChunk(chunk, world); 
        console.log(`Генерация объектов для чанка ${chunk.id} завершена`);
    }

    // --- НОВАЯ ФУНКЦИЯ ДЛЯ ДАНЖЕЙ ---
    static spawnDungeonChests(chunk, world, startX, endX, BLOCK_SIZE) {
        // Находим центр ближайшего данжа (используем формулу из твоего DungeonGenerator)
        const OFFSET = 5500;
        const SPACING_DUNGEON = 15000;
        const centerPoint = Math.round((startX - OFFSET) / SPACING_DUNGEON) * SPACING_DUNGEON + OFFSET;

        // Получаем полные данные данжа (все блоки), чтобы искать пол без разрывов между чанками
        const dungeonData = world.dungeonGenerator.getDungeonData(centerPoint, world);
        if (!dungeonData) return;

        dungeonData.rects.forEach(rect => {
            // Ищем только прямоугольники с фоном данжа, которые попадают в текущий чанк
            if (rect.type.includes("dungeon_bg") && rect.x + rect.w > startX && rect.x < endX) {
                
                // Перебираем каждую плитку внутри прямоугольника "воздуха"
                for (let tx = rect.x; tx < rect.x + rect.w; tx += BLOCK_SIZE) {
                    for (let ty = rect.y; ty < rect.y + rect.h; ty += BLOCK_SIZE) {
                        
                        // Строго в пределах нашего чанка
                        if (tx >= startX && tx < endX) {
                            const spawnChance = hash(tx * 1.5 + ty * 0.5 + WORLD_SEED);
                            
                            // Шанс спавна: 1.5% на каждую пустую плитку, где есть пол
                            if (spawnChance < 0.015) { 
                                
                                // ПРОВЕРКА ПОЛА: Ищем блок стены ровно на 1 клетку ниже
                                const hasFloor = dungeonData.rects.some(r => 
                                    r.type.includes("wall") && 
                                    tx >= r.x && tx < r.x + r.w && // Совпадение по X
                                    r.y === ty + BLOCK_SIZE        // Стена ровно под нами
                                );

                                if (hasFloor) {
                                    const chestIndex = Math.floor(tx / 80);
                                    
                                    // Создаем джунглевый сундук.
                                    // ty + 5 сдвигает сундук на 5 пикселей вниз (потому что высота клетки 40, а сундука 35),
                                    // чтобы он идеально стоял на полу, а не висел в воздухе.
                                    const jChest = new JungleChest(tx, ty + 5, chestIndex);
                                    
                                    chunk.objects.push({
                                        type: "chest", // Оставляем тип 'chest', чтобы твой Renderer отрисовал его автоматически
                                        instance: jChest,
                                        x: jChest.x,
                                        y: jChest.y,
                                        width: jChest.width,
                                        height: jChest.height,
                                        zIndex: 1 
                                    });
                                }
                            }
                        }
                    }
                }
            }
        });
    }
}