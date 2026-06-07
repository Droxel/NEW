// src/world/chunk/Chunk.js
import { fbm, WORLD_SEED } from "../Seed.js"; 
import { Statue } from "../objects/Statue.js";
import { ChestManager } from "../objects/ChestManager.js";
import { LifeBushManager } from "../objects/LifeBushManager.js";
import { GameState } from "../../core/GameState.js";
import { Altar } from "../objects/Altar.js";
import { JungleGuard } from "../objects/JungleGuard.js";
import { JungleSeal } from "../objects/JungleSeal.js";
import { desertConfig, iceConfig, jungleConfig, pillarConfig } from "../../data/statueConfigs.js";
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
            console.error(`❌ [Chunk ${this.id}] ОШИБКА: Мир не передался!`);
            return;
        }

        const startX = this.id * 1024;
        const endX = startX + 1024;
        let rocksCount = 0; // Счетчик для отладки

        console.log(`--- 🛠️ Генерация чанка ${this.id} (от ${startX} до ${endX}) ---`);

        // --- 0. СТРУКТУРЫ ---
        StructureManager.generateStructuresForChunk(this, world);

        // --- 1. ГЕНЕРАЦИЯ РАСТИТЕЛЬНОСТИ И ДЕКОРА ---
        let x = startX;
        while (x < endX) {
            const biome = world.getBiome(x);
            const waterData = world.getWaterData(x);
            const y = world.getHeight(x);
            
            // --- ЛОГИКА ДЛЯ ОКЕАНА И ПЛЯЖА ---
            if (biome === "ocean" || biome === "beach") {
                if (biome === "ocean" && waterData.depthFactor > 0.3) {
                    const coralDensity = fbm(x, { scale: 0.01, octaves: 1, seed: WORLD_SEED + 999 });
                    if (coralDensity > 0) { 
                        const imgNum = Math.floor(Math.random() * 3) + 1;
                        this.objects.push({
                            type: "seaweed",
                            x: x - 30, y: y - 50, width: 60, height: 80,
                            imgKey: `seaweed${imgNum}`
                        });
                    }
                }
                x += (biome === "ocean") ? 100 : 200;
                continue; 
            }

 // --- 🔥 ЛОГИКА КАМНЕЙ ---
const rockRoll = Math.random();
if (rockRoll < 0.05) { // Сделали пореже (было 0.15)
    rocksCount++;
    
    // Генерируем случайный размер
    const randomScale = 0.6 + Math.random() * 1.2;
    
    // Генерируем "неправильную" форму из 5-8 точек
    const points = [];
    const segments = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        // Случайный радиус для каждой точки, чтобы создать "остроту"
        const dist = 8 + Math.random() * 10; 
        points.push({
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist * 0.7 // Сплющиваем по вертикали для перспективы
        });
    }

    this.objects.push({
        type: "decor_rock",
        x: x + (Math.random() * 40 - 20),
        y: y, 
        scale: randomScale,
        points: points, // Сохраняем форму
        rotation: Math.random() * Math.PI // Добавляем случайный поворот
    });
}

            // --- ЛОГИКА ДЕРЕВЬЕВ ---
            let forestDensity = fbm(x, { scale: 0.005, octaves: 2, seed: WORLD_SEED + 777 });
            
            if (forestDensity < -0.2) { 
                x += 60; 
                continue; 
            }

            // Настройка шага
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

            // Шанс искажения
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

            x += step; 
        }



        // --- 2. ГЕНЕРАЦИЯ СТАТУЙ И ПРОЧЕГО ---
        this.generateStatues(startX, endX, world);
        ChestManager.generateChestsForChunk(this, world);
        LifeBushManager.generateBushesForChunk(this, world);
    
        // --- 3. ГЕНЕРАЦИЯ ДАНЖЕВЫХ ОБЪЕКТОВ ---
        const dungeonData = world.dungeonGenerator.getDungeonBlocksForChunk(startX, 1024, world);
        
        if (dungeonData.length > 0) {
            console.log(`[Chunk ${this.id}] Получено блоков данжа: ${dungeonData.length}`);
        }

        dungeonData.forEach(data => {
            if (data.type === "jungle_guard_left" || data.type === "jungle_guard_right") {
                const side = data.type === "jungle_guard_left" ? "left" : "right";
                this.objects.push(new JungleGuard(data.x, data.y, side)); 
            } 
            else if (data.type === "jungle_seal") {
                this.objects.push(new JungleSeal(data.x, data.y, data.width, data.height));
            }
            else if (data.type === "boss_torch") {
                this.objects.push(new BossTorch(data));
            }
            else if (data.type === "boss_pillar") {
                this.objects.push(new BossPillar(data));
            }
        });
    }

    update(dt, player) {
        // 1. Обновляем все объекты в чанке
        if (this.objects) {
            for (let i = this.objects.length - 1; i >= 0; i--) {
                const obj = this.objects[i];
                const target = (obj.instance && typeof obj.instance.update === 'function') ? obj.instance : 
                               (typeof obj.update === 'function' ? obj : null);

                if (target) {
                    target.update(dt, player); 
                }

                if (obj.type === "life_bush" && obj.instance && !obj.instance.isBroken) {
                    const fruitData = obj.instance.checkCollision(player);
                    if (fruitData) window.dropItemToWorld(fruitData);
                }
            }
        }

        // Обновляем статуи и алтари
        if (this.statues) {
            for (let i = this.statues.length - 1; i >= 0; i--) {
                const statue = this.statues[i];
                if (typeof statue.update === 'function') {
                    statue.update(dt, player);
                }
            }
        }

        // 2. Логика удаления (печать джунглей)
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
        this.objects.forEach(obj => {
            if (obj.type === "boss_torch" || obj.type === "boss_pillar") {
                if (typeof obj.draw === 'function') obj.draw(ctx, camera); 
            }
        });

        // --- СЛОЙ 3: ФИЗИЧЕСКИЕ СТЕНЫ ---
        this.objects.forEach(obj => {
            if (wallTypes.includes(obj.type)) {
                ctx.fillStyle = "#1a1a1a";
                ctx.fillRect(obj.x - camera.x, obj.y - camera.y, (obj.width || 40) + 1, (obj.height || 40) + 1);
            }
        });

        // --- СЛОЙ 4: ИНТЕРАКТИВ И МИР (Деревья, Сундуки, Кусты) ---
        this.objects.forEach(obj => {
            if (bgTypes.includes(obj.type) || wallTypes.includes(obj.type) || 
                obj.type === "boss_torch" || obj.type === "boss_pillar") return;

            if (obj.type === "chest") {
                const img = assets[obj.instance?.isOpen ? "chestopen" : "chestunopened"];
                if (img?.complete) ctx.drawImage(img, obj.x - camera.x, obj.y - camera.y, obj.width, obj.height);
            } 
            else if (obj.type === "decor_rock") {
                ctx.fillStyle = "#7a7a7a";
                ctx.beginPath();
                ctx.ellipse(obj.x - camera.x, obj.y - camera.y - 15, 14, 10, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#4a4a4a";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            else if (obj.type === "seaweed") {
                const img = assets[obj.imgKey];
                if (img && img.complete) {
                    const wave = Math.sin(Date.now() * 0.002 + obj.x * 0.01) * 5;
                    ctx.drawImage(img, obj.x - camera.x + wave, obj.y - camera.y, obj.width, obj.height);
                }
            }
            else if (typeof obj.draw === 'function') {
                obj.draw(ctx, camera); 
            }
        });

        // --- СЛОЙ 5: ФИНАЛЬНЫЕ ОБЪЕКТЫ (Статуи и Алтари) ---
        if (this.statues) {
            this.statues.forEach(s => {
                if (typeof s.draw === 'function') s.draw(ctx, assets);
            });
        }
    }

    generateStatues(startX, endX, world) {
        const centerX = startX + 512;
        const STATUE_SPACING = 2500; 
        const spotX = Math.round(centerX / STATUE_SPACING) * STATUE_SPACING;

        if (spotX >= startX && spotX < endX) {
            if (world.isWater(spotX)) return;
            const biome = world.getBiome(spotX);
            const y = world.getHeight(spotX);
            const biomeLeft = world.getBiome(spotX - 150);
            const biomeRight = world.getBiome(spotX + 150);

            if (biomeLeft !== biome || biomeRight !== biome) return;

            let config = null;
            if (biome === 'desert') config = desertConfig;
            else if (biome === 'snow') config = iceConfig;
            else if (biome === 'jungle') config = jungleConfig;
            else if (biome === 'forest') config = pillarConfig;

            if (config) {
                const bossKey = config.bossKey;

                if (GameState.bossesDefeated && GameState.bossesDefeated[bossKey]) {
                    this.statues.push(new Altar(spotX, y, bossKey));
                    console.log(`🏗️ Мир сгенерировал Алтарь вместо статуи ${bossKey}, так как он повержен.`);
                } else {
                    this.statues.push(new Statue(spotX, y, config));
                }
            }
        }
    }
}