// src/world/chunk/Chunk.js
import { fbm, WORLD_SEED } from "../Seed.js"; 
import { Statue } from "../objects/Statue.js";
import { ChestManager } from "../objects/ChestManager.js";
import { LifeBushManager } from "../objects/LifeBushManager.js";
import { GameState } from "../../core/GameState.js"; // Проверь путь до GameState
import { Altar } from "../objects/Altar.js";
import { JungleGuard } from "../objects/JungleGuard.js";
import { JungleSeal } from "../objects/JungleSeal.js"; // Импортируем новый класс
// Вот тут главная правка: идем в папку data
import { desertConfig, iceConfig, jungleConfig, pillarConfig } from "../../data/statueConfigs.js";

// Импорт Менеджера Структур
import { StructureManager } from "../structures/StructureManager.js";
import { BossTorch, BossPillar } from '../objects/BossDecorations.js';

export class Chunk {
    constructor(id, worldInstance) {
        this.id = id;
        this.objects = [];
        this.statues = []; 
        this.generate(worldInstance);
    }

generate(world) {
        if (!world || !world.getHeight) {
            console.error("❌ ОШИБКА: Мир не передался в чанк!");
            return;
        }

        const startX = this.id * 1024;
        const endX = startX + 1024;

        // --- 0. СТРУКТУРЫ ---
        StructureManager.generateStructuresForChunk(this, world);

        // --- 1. ГЕНЕРАЦИЯ ДЕРЕВЬЕВ ---
        let x = startX;
        while (x < endX) {
            // Сначала получаем данные о мире в этой точке
            const waterData = world.getWaterData(x);
            if (waterData.isWater) { 
                x += 30; 
                continue; 
            }

            const biome = world.getBiome(x); // <--- ВОТ ТУТ МЫ ЕГО ОБЪЯВЛЯЕМ
            const y = world.getHeight(x);
            
            // Считаем плотность леса через шум
            let forestDensity = fbm(x, { scale: 0.005, octaves: 2, seed: WORLD_SEED + 777 });
            
            // Пропуски для реализма
            if (forestDensity < -0.2) { x += 60; continue; }
            if (biome === "desert" && forestDensity < 0.3) { x += 200; continue; }
            
            // Считаем шаг до следующего дерева
            let densityNorm = (forestDensity + 1) / 2;
            let step = 150 - (densityNorm * 120);
            step += (Math.random() * 40 - 20);

            // Настройка внешнего вида дерева
            let treeData = { w: 100, h: 200, imgKey: "tree2" };
            if (biome === "plains") treeData = { w: 120, h: 220, imgKey: "tree2" };
            else if (biome === "forest") treeData = { w: 140, h: 280, imgKey: "tree1" };
            else if (biome === "jungle") treeData = { w: 130, h: 320, imgKey: "tree4" };
            else if (biome === "snow") treeData = { w: 140, h: 240, imgKey: "tree3" };
            else if (biome === "desert") treeData = { w: 70, h: 160, imgKey: "tree6" }; 

            // Шанс искажения (твоя новая логика)
            const level = GameState.corruptionLevel || 0;
            let isCorrupted = false;

            if (biome === "corruption") {
                isCorrupted = true;
            } else if (level > 0) {
                const chance = level === 1 ? 0.05 : (level === 2 ? 0.15 : 0.30);
                if (Math.random() < chance) isCorrupted = true;
            }

            if (isCorrupted) {
                treeData.imgKey = "distorted_tree";
                treeData.w = 130;
                treeData.h = 250;
            }

            const jitterX = (Math.random() * 20) - 10;
            const randomScale = 0.9 + Math.random() * 0.6;
            
            this.objects.push({
                type: "tree",
                x: (x + jitterX) - (treeData.w * randomScale) / 2,
                y,
                width: treeData.w * randomScale,
                height: treeData.h * randomScale,
                imgKey: treeData.imgKey
            });

            x += step; // Идем дальше по циклу
        }

        // --- 2. ГЕНЕРАЦИЯ СТАТУЙ И ПРОЧЕГО ---
        this.generateStatues(startX, endX, world);
        ChestManager.generateChestsForChunk(this, world);
        LifeBushManager.generateBushesForChunk(this, world);
    
        // --- 3. ГЕНЕРАЦИЯ ДАНЖЕВЫХ ОБЪЕКТОВ (Печать и Стражи) ---
const dungeonData = world.dungeonGenerator.getDungeonBlocksForChunk(startX, 1024, world);

// ДОБАВИТЬ ЭТОТ ЛОГ:
console.log(`[Chunk ${this.id}] Получено блоков данжа: ${dungeonData.length}`);

dungeonData.forEach(data => {
    if (data.type === "jungle_guard_left" || data.type === "jungle_guard_right") {
        const side = data.type === "jungle_guard_left" ? "left" : "right";
        this.objects.push(new JungleGuard(data.x, data.y, side)); 
    } 
    else if (data.type === "jungle_seal") {
        // ✅ ВМЕСТО обычного объекта создаем экземпляр класса
        this.objects.push(new JungleSeal(data.x, data.y, data.width, data.height));
    }
else if (data.type === "boss_torch") {
        console.log("🔥 Спавн факела! Проверяем параметры:", data);
        this.objects.push(new BossTorch(data));
    }
    else if (data.type === "boss_pillar") {
        console.log("🏛️ Спавн колонны! Проверяем параметры:", data);
        this.objects.push(new BossPillar(data));
    }
});

    }

update(dt, player) {
    // 1. Обновляем все объекты в чанке
    if (this.objects) {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];

            // Определяем цель для обновления: либо инстанс, либо сам объект
            const target = (obj.instance && typeof obj.instance.update === 'function') ? obj.instance : 
                           (typeof obj.update === 'function' ? obj : null);

            if (target) {
                // Это заставляет огонь разгораться, двигать частицы и т.д.
                target.update(dt, player); 
            }

            // Дополнительная логика (например, сбор ягод с кустов)
            if (obj.type === "life_bush" && obj.instance && !obj.instance.isBroken) {
                const fruitData = obj.instance.checkCollision(player);
                if (fruitData) window.dropItemToWorld(fruitData);
            }
        }
    }

    // 2. Специфическая логика удаления (например, печать джунглей)
    if (GameState.bossesDefeated && GameState.bossesDefeated['jungle_boss']) {
        this.objects = this.objects.filter(obj => obj.type !== "jungle_seal");
    }
}

draw(ctx, camera = { x: 0, y: 0 }) {
    const bgTypes = ["dungeon_bg", "dungeon_bg_smooth"];
    const wallTypes = ["dungeon_wall", "dungeon_wall_smooth", "blue_block"];

    // --- СЛОЙ 1: ГЛУБОКИЙ ФОН (ТЕМНОТА) ---
    this.objects.forEach(obj => {
        if (bgTypes.includes(obj.type)) {
            ctx.fillStyle = "#0a0a0a";
            ctx.fillRect(obj.x - camera.x, obj.y - camera.y, (obj.width || 40) + 1, (obj.height || 40) + 1);
        }
    });

    // --- СЛОЙ 2: ДЕКОРАЦИИ ТРОННОГО ЗАЛА (Колонны и Факелы) ---
    // Рисуем их ДО стен, чтобы они казались встроенными в интерьер
    this.objects.forEach(obj => {
        if (obj.type === "boss_torch" || obj.type === "boss_pillar") {
            if (typeof obj.draw === 'function') {
                obj.draw(ctx, camera); 
            }
        }
    });

    // --- СЛОЙ 3: ФИЗИЧЕСКИЕ СТЕНЫ ---
    // Рисуются поверх колонн, чтобы перекрывать их края, если нужно
    this.objects.forEach(obj => {
        if (wallTypes.includes(obj.type)) {
            ctx.fillStyle = "#1a1a1a";
            ctx.fillRect(obj.x - camera.x, obj.y - camera.y, (obj.width || 40) + 1, (obj.height || 40) + 1);
        }
    });

    // --- СЛОЙ 4: ИНТЕРАКТИВ И МИР (Деревья, Сундуки, Кусты) ---
    this.objects.forEach(obj => {
        // Пропускаем уже отрисованное
        if (bgTypes.includes(obj.type) || wallTypes.includes(obj.type) || 
            obj.type === "boss_torch" || obj.type === "boss_pillar") return;

        if (obj.type === "chest") {
            const img = assets[obj.instance?.isOpen ? "chestopen" : "chestunopened"];
            if (img?.complete) ctx.drawImage(img, obj.x - camera.x, obj.y - camera.y, obj.width, obj.height);
        } 
        else if (obj.draw) {
            obj.draw(ctx, camera); 
        }
    });

    // --- СЛОЙ 5: ФИНАЛЬНЫЕ ОБЪЕКТЫ (Статуи и Алтари) ---
    if (this.statues) {
        this.statues.forEach(s => s.draw(ctx, assets));
    }
}
    generateStatues(startX, endX, world) {
        // (Твой старый код статуй без изменений)
        const centerX = startX + 512;
        const STATUE_SPACING = 2500; 
        const spotX = Math.round(centerX / STATUE_SPACING) * STATUE_SPACING;

        if (spotX >= startX && spotX < endX) {
            if (world.isWater(spotX)) return;
            const biome = world.getBiome(spotX);
            const y = world.getHeight(spotX);
            const biomeLeft = world.getBiome(spotX - 150);
            const biomeRight = world.getBiome(spotX + 150);

            if (biomeLeft !== biome || biomeRight !== biome) {
                return;
            }

            let config = null;
            if (biome === 'desert') config = desertConfig;
            else if (biome === 'snow') config = iceConfig;
            else if (biome === 'jungle') config = jungleConfig;
            else if (biome === 'forest') config = pillarConfig;

if (config) {
            const bossKey = config.bossKey;

            // ПРОВЕРКА: Если босс уже побежден, ставим Алтарь вместо Статуи
            if (GameState.bossesDefeated && GameState.bossesDefeated[bossKey]) {
                // Ставим Алтарь (он создается на чистом y, без вкапывания)
                this.statues.push(new Altar(spotX, y, bossKey));
                console.log(`🏗️ Мир сгенерировал Алтарь вместо статуи ${bossKey}, так как он повержен.`);
            } else {
                // Иначе ставим обычную статую (она сама добавит +50 к y в своем конструкторе)
                this.statues.push(new Statue(spotX, y, config));
            }
        }
    
        }
    }
}