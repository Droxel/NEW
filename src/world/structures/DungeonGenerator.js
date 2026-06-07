//DungeonGenerator.js
import { isLargeBiome } from "../terrain/BiomeMap.js";
import { GameState } from "../../core/GameState.js";
import { DungeonCarver, BLOCK_SIZE, createRandom } from "./dungeon/DungeonCarver.js";
import { buildEntrance, buildDescent, buildMaze } from "./dungeon/DungeonPieces.js";

const DUNGEON_SPACING = 15000;

export class DungeonGenerator {
    constructor() {
        this.cache = new Map();
    }

getDungeonBlocksForChunk(chunkX, chunkWidth, world) {
    const blocks = [];
    const chunkEnd = chunkX + chunkWidth;
    const OFFSET = 5500;
    
    const regionX = Math.round((chunkX - OFFSET) / DUNGEON_SPACING) * DUNGEON_SPACING + OFFSET;
    const dungeonData = this.getDungeonData(regionX, world);
    
    if (!dungeonData) return blocks;

    for (const rect of dungeonData.rects) {
        if (rect.type === "jungle_seal" && GameState.bossesDefeated['jungle_boss']) {
            continue; 
        }

        const rectW = rect.w || 40;
        const rectH = rect.h || 40;

        // Список уникальных объектов, которые нельзя дублировать между чанками
        const isUniqueEntity = ["boss_torch", "boss_pillar", "jungle_seal", "jungle_guard_left", "jungle_guard_right", "boss_spawn_trigger"].includes(rect.type);

        if (isUniqueEntity) {
            // Привязываем объект к чанку строго по его центру
            const centerX = rect.x + (rectW / 2);
            if (centerX >= chunkX && centerX < chunkEnd) {
                blocks.push({ 
                    ...rect, // Сохраняем delay, roomCx и остальные кастомные данные!
                    width: rectW, 
                    height: rectH 
                });
            }
        } 
        else {
            // Для обычных стен и фона оставляем проверку на пересечение (они могут тянуться через границу)
            if (rect.x + rectW > chunkX && rect.x < chunkEnd) {
                blocks.push({ 
                    ...rect, 
                    width: rectW, 
                    height: rectH 
                });
            }
        }
    }
    return blocks;
}

    shouldSpawnDungeon(centerX, world) {
        if (this.cache.has(centerX)) {
            return this.cache.get(centerX) !== null;
        }

        const isJungle = world.getBiome(centerX) === "jungle";
        const isLarge = isLargeBiome(centerX, "jungle", 400);
        const nearWater = world.isWater(centerX);
        const canSpawn = isJungle && isLarge && !nearWater;

        if (!canSpawn) {
            this.cache.set(centerX, null); 
        }
        return canSpawn;
    }

    getDungeonData(centerX, world) {
        if (!this.shouldSpawnDungeon(centerX, world)) {
            const biome = world.getBiome(centerX);
            console.log(`%c[Dungeon] ❌ Пропуск на X: ${Math.round(centerX)}. Причина: ${biome !== 'jungle' ? 'не джунгли' : 'слишком мало места/вода'}`, "color: #777;");
            return null;
        }

        if (this.cache.get(centerX) && this.cache.get(centerX).rects) {
            return this.cache.get(centerX);
        }

        console.log(`%c[Dungeon] 🧱 НАЧАЛО ГЕНЕРАЦИИ ДАНЖА на X: ${Math.round(centerX)}`, "color: #4CAF50; font-weight: bold;");

        const groundY = world.getHeight(centerX, true); 
        const startY = Math.floor(groundY / BLOCK_SIZE) * BLOCK_SIZE;
        const startX = Math.floor(centerX / BLOCK_SIZE) * BLOCK_SIZE;
        
        const carver = new DungeonCarver(startX, startY);
        const random = createRandom(Math.abs(Math.floor(centerX)));

        // Фаза 1: Вход
        const topOfConeY = startY - (15 * BLOCK_SIZE); 
        buildEntrance(carver, startX, topOfConeY);

        // Фаза 2: Спуски
        const descentStart = { x: startX, y: topOfConeY + (25 * BLOCK_SIZE) };
        const descentEnd = buildDescent(carver, descentStart.x, descentStart.y, random);

        // Фаза 3: Лабиринт
        buildMaze(carver, descentEnd.x, descentEnd.y, random);

        // Фаза 4: Оптимизация фона и стен
        carver.optimizeBackgrounds();
        carver.generateWalls();

        const result = { rects: carver.rects };
        this.cache.set(centerX, result);
        return result;
    }
}