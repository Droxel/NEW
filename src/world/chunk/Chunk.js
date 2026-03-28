// src/world/chunk/Chunk.js
import { fbm, WORLD_SEED } from "../Seed.js"; 
import { Statue } from "../objects/Statue.js";
import { ChestManager } from "../objects/ChestManager.js";
import { LifeBushManager } from "../objects/LifeBushManager.js";
import { GameState } from "../../core/GameState.js"; // Проверь путь до GameState
import { Altar } from "../objects/Altar.js";

// Вот тут главная правка: идем в папку data
import { desertConfig, iceConfig, jungleConfig, pillarConfig } from "../../data/statueConfigs.js";

// Импорт Менеджера Структур
import { StructureManager } from "../structures/StructureManager.js";

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