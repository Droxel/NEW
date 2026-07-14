// src/core/Braw.js
import { CONFIG } from "../data/config.js";
import { MerchantUI } from "../ui/screens/MerchantUI.js"; 
import { bossManager } from "../entities/bosses/BossManager.js";
import { assets } from "./AssetLoader.js"; 
import { merchant } from "../entities/npcs/Merchant.js";
import { residentManager } from "../entities/npcs/residents/ResidentManager.js";
import { GameState } from "../core/GameState.js";
import { biomeWeaponManager } from "../entities/weapons/BiomeWeapon.js";
import { getOceanWaterData, getOceanMix } from "../world/Ocean.js"; 
import { oceanCreatureManager } from "../entities/mobs/ocean/OceanCreatureManager.js";
import { weatherManager } from "../world/sky/Weather.js";
export { assets };

if (typeof window !== 'undefined' && !window.assets) {
    window.assets = assets;
}

// --- КОНСТАНТЫ ---
const LAKE_COLORS = {
    desert: [100, 200, 255], 
    plains: [0, 120, 255], 
    forest: [20, 100, 200],
    jungle: [50, 180, 100], 
    snow: [180, 230, 255], 
    village: [0, 150, 255],
    corruption: [80, 0, 120],
    beach: [235, 215, 145],
    ocean: [60, 100, 140]  
};

export let cameraX = 0;
export let cameraY = 0;
export let zoomLevel = 1.0; 

export function setZoom(value) {
    zoomLevel = value;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

export function Braw(
    ctx, 
    player, 
    world, 
    time, 
    boss, 
    sky, 
    bgManager, 
    petManager, 
    mobManager,
    nimalManager, 
    krakenManager, // <--- 10-й
    droppedItems,  // <--- 11-й
    currentLights  // <--- 12-й
){
    // 1. ПЛАВНОЕ ДВИЖЕНИЕ КАМЕРЫ 
    const targetCameraX = player.x - (CONFIG.width / 2) / zoomLevel;
    const targetCameraY = player.y - (CONFIG.height / 2) / zoomLevel;

    cameraX += (targetCameraX - cameraX) * 0.1;
    cameraY += (targetCameraY - cameraY) * 0.1;

    const renderCamX = Math.floor(cameraX);
    const renderCamY = Math.floor(cameraY);

    // 1.5. ОБНОВЛЕНИЕ ПОГОДЫ
    const currentDt = time?.dt || 0.016; 
    weatherManager.update(currentDt);

    // 2. НЕБО
    if (sky) sky.draw(ctx, time, weatherManager);
    weatherManager.drawSkyOverlay(ctx);

    // 3. ФОНЫ
    if (bgManager) bgManager.draw(ctx, assets, renderCamX, renderCamY);

    // ПРИМЕНЯЕМ ЗУМ 
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel); 
    ctx.translate(-renderCamX, -renderCamY);

    // 4. ПОДГОТОВКА ЧАНКОВ
    const visibleWidth = CONFIG.width / zoomLevel; 
    const startChunk = world.chunkManager.getChunkId(renderCamX - 200);
    const endChunk = world.chunkManager.getChunkId(renderCamX + visibleWidth + 200);

// --- СЛОЙ 1: ДЕРЕВЬЯ И ОБЪЕКТЫ МИРА ---
    for (let i = startChunk; i <= endChunk; i++) {
        const chunk = world.chunkManager.getChunk(i * (CONFIG.chunkSize || 1024));
        if (!chunk?.objects) continue;

        chunk.objects.forEach(obj => {
            // Отрисовка деревьев
            if (obj.type === "tree") {
                if (obj.x + obj.width < renderCamX || obj.x > renderCamX + visibleWidth) return;
                
                const img = assets[obj.imgKey];
                const drawY = (obj.y + player.size) - obj.height + 45;
                if (img?.complete && img.naturalHeight !== 0) {
                    ctx.drawImage(img, obj.x, drawY, obj.width, obj.height);
                }
            }
            
            // Отрисовка проклятого кристалла
            if (obj.type === "cursed_crystal") {
                if (obj.x + obj.w < renderCamX || obj.x > renderCamX + visibleWidth) return;
                if (typeof obj.draw === "function") {
                    obj.draw(ctx, assets);
                }
            }
        });
    }
    // === 1. СБОР ОБЪЕКТОВ АТЛАНТИДЫ РАЗДЕЛЕННО ПО СЛОЯМ ===
    const atlantisBg = [];
    const atlantisFg = [];

    for (let i = startChunk; i <= endChunk; i++) {
        const chunk = world.chunkManager.getChunk(i * (CONFIG.chunkSize || 1024));
        if (!chunk || !chunk.objects) continue;

        chunk.objects.forEach(obj => {
            if (obj.type === "atlantis") {
                const objWidth = obj.width || obj.w || 40; 
                if (obj.x + objWidth >= renderCamX && obj.x <= renderCamX + visibleWidth) {
                    if (obj.layer === "bg") {
                        atlantisBg.push(obj);
                    } else {
                        atlantisFg.push(obj);
                    }
                }
            }
        });
    }

    // === РИСУЕМ СЛОЙ 1: ДАЛЬНИЙ ПЛАН АТЛАНТИДЫ (ЗА ВСЕМ) ===
    atlantisBg.forEach(obj => {
        if (typeof obj.draw === 'function') {
            obj.draw(ctx, assets);
        }
    });

    // --- СЛОЙ 2: ЗЕМЛЯ И ЗАДНЯЯ ВОДА ---
    const startX = renderCamX;
    const endX = renderCamX + visibleWidth + 1; 
    const step = 8;

    for (let x = startX; x < endX; x += step) {
        const groundY = world.getHeight(x, true);
        const waterData = world.getWaterData(x); 
        const mix = world.getBiomeMix(x);
        const oceanMixInfo = getOceanMix(x);

        const baseR = (255*mix.desert)+(92*mix.plains)+(63*mix.forest)+(47*mix.jungle)+(255*mix.snow) + (100 * mix.village) + (74 * mix.corruption);
        const baseG = (248*mix.desert)+(138*mix.plains)+(107*mix.forest)+(79*mix.jungle)+(255*mix.snow) + (160 * mix.village) + (0 * mix.corruption);
        const baseB = (109*mix.desert)+(58*mix.plains)+(42*mix.forest)+(47*mix.jungle)+(255*mix.snow) + (60 * mix.village) + (130 * mix.corruption);

        const t = oceanMixInfo.weight; 
        const oceanR = 235 * (1 - t) + 60 * t;
        const oceanG = 215 * (1 - t) + 100 * t;
        const oceanB = 145 * (1 - t) + 140 * t;

        let finalR, finalG, finalB;

        if (oceanMixInfo.active) {
            const influence = (t > 0) ? 1 : oceanMixInfo.beach;
            finalR = Math.floor(baseR * (1 - influence) + oceanR * influence);
            finalG = Math.floor(baseG * (1 - influence) + oceanG * influence);
            finalB = Math.floor(baseB * (1 - influence) + oceanB * influence);
        } else {
            finalR = Math.floor(baseR);
            finalG = Math.floor(baseG);
            finalB = Math.floor(baseB);
        }

        // Рисуем землю
        ctx.fillStyle = `rgb(${finalR}, ${finalG}, ${finalB})`;
        ctx.fillRect(x, groundY + player.size, step + 0.5, 20000);
// --- ЗАДНИЙ СЛОЙ ВОДЫ (ЗА ОБЪЕКТАМИ) ---
        if (waterData.isWater) {
            const wLevel = waterData.level + player.size;
            const wBottom = waterData.bottom + player.size;
            const safeTime = (typeof time === "object" && time !== null) ? (time.value ?? time.time ?? time.now ?? 0) : (time || 0);

            // Создаем волновой сдвиг по горизонтали для имитации преломления света в воде
            const distortionX = Math.sin(x * 0.02 + safeTime * 2) * 6;

            if (waterData.isOcean) {
                const wt = waterData.depthFactor || 0;
                
                const movingWave = Math.sin((x + distortionX) * 0.03 + safeTime * 3 + (wt * 10));
                const surfaceSway = Math.sin((x + distortionX) * 0.01 + safeTime) * 4;
                let shoreSurge = (wt < 0.3) ? Math.max(0, movingWave) * 15 * (1 - wt / 0.3) : 0;

                const currentWaterY = wLevel + surfaceSway - shoreSurge;

                const wr = Math.floor(0 * (1 - wt) + 5 * wt);
                const wg = Math.floor(230 * (1 - wt) + 40 * wt);
                const wb = Math.floor(255 * (1 - wt) + 120 * wt);
                const alpha = 0.5;

                ctx.fillStyle = `rgba(${wr}, ${wg}, ${wb}, ${alpha})`;
                if (!isNaN(currentWaterY)) {
                    // Рисуем блок с учетом волнового смещения координат
                    ctx.fillRect(x + distortionX, currentWaterY, step + 0.5, Math.max(0, wBottom - currentWaterY));
                }
            } else {
                let lr = 0, lg = 0, lb = 0, tw = 0;
                for (const key in LAKE_COLORS) {
                    if (mix[key] > 0) {
                        lr += LAKE_COLORS[key][0] * mix[key];
                        lg += LAKE_COLORS[key][1] * mix[key];
                        lb += LAKE_COLORS[key][2] * mix[key];
                        tw += mix[key];
                    }
                }
                if (tw === 0) { lr = 0; lg = 120; lb = 255; }
                ctx.fillStyle = `rgba(${Math.floor(lr)}, ${Math.floor(lg)}, ${Math.floor(lb)}, 0.5)`;
                ctx.fillRect(x + distortionX, wLevel, step + 0.5, Math.max(0, wBottom - wLevel));
            }
        }
    }

    // === РИСУЕМ СЛОЙ 2.1: ПЕРЕДНИЙ ПЛАН АТЛАНТИДЫ ===
    ctx.save();
    atlantisFg.forEach(obj => {
        if (typeof obj.draw === 'function') {
            obj.draw(ctx, assets);
        }
    });
    ctx.restore();

    // --- СЛОЙ 2.5: ПЯТНА ПОРЧИ ---
    if (world.corruptionManager) {
       world.corruptionManager.draw(ctx, renderCamX, renderCamX + visibleWidth, world);
    }

    // --- СЛОЙ 3: ДАНЖ И ОСТАЛЬНОЙ ИНТЕРАКТИВ ---
    const bgLayer = [];
    const decoLayer = [];
    const wallLayer = [];
    const interactiveLayer = [];
    const statuesLayer = [];

    for (let i = startChunk; i <= endChunk; i++) {
        const chunk = world.chunkManager.getChunk(i * (CONFIG.chunkSize || 1024));
        if (!chunk) continue;

        if (chunk.objects) {
            chunk.objects.forEach(obj => {
                const objWidth = obj.width || obj.w || 40; 
                if (obj.x + objWidth < renderCamX || obj.x > renderCamX + visibleWidth) return;

                if (obj.type === "dungeon_bg" || obj.type === "dungeon_bg_smooth") {
                    bgLayer.push(obj);
                } else if (obj.type === "boss_torch" || obj.type === "boss_pillar") {
                    decoLayer.push(obj);
                } else if (obj.type === "dungeon_wall" || obj.type === "dungeon_wall_smooth" || obj.type === "blue_block") {
                    wallLayer.push(obj);
                } else if (obj.type !== "atlantis" && obj.type !== "tree") { 
                    interactiveLayer.push(obj); 
                }
            });
        }

        if (chunk.statues) {
            chunk.statues.forEach(s => statuesLayer.push(s));
        }
    }

    // 3.1. СЛОЙ ФОНА ДАНЖА
    bgLayer.forEach(obj => {
        const isTop = obj.type === "dungeon_bg_smooth";
        ctx.fillStyle = isTop ? "#2a2a24" : "#1a1e15"; 
        ctx.fillRect(obj.x, obj.y, obj.width + 1, obj.height + 1);
        
        ctx.strokeStyle = isTop ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.2)";
        ctx.lineWidth = 2;
        
        const stepGrid = 80; 
        ctx.beginPath(); 
        for (let bx = 0; bx < obj.width; bx += stepGrid) {
            for (let by = 0; by < obj.height; by += stepGrid) {
                if ((bx + by) % 3 === 0) { 
                    ctx.moveTo(obj.x + bx, obj.y + by + stepGrid);
                    ctx.lineTo(obj.x + bx + stepGrid / 2, obj.y + by + stepGrid);
                }
            }
        }
        ctx.stroke(); 
    });

    // 3.2. СЛОЙ ДЕКОРАЦИЙ
    decoLayer.forEach(obj => {
        if (typeof obj.draw === 'function') {
            obj.draw(ctx, assets); 
        }
    });

    // 3.3. СЛОЙ СТЕН
    wallLayer.forEach(obj => {
        const seed = (obj.x * 3421 + obj.y * 1234);
        const isTop = obj.type === "dungeon_wall_smooth";
        
        ctx.fillStyle = isTop ? "#636353" : "#4a4f3d"; 
        ctx.fillRect(obj.x, obj.y, obj.width + 1, obj.height + 1);

        ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
        ctx.fillRect(obj.x + 2, obj.y + 2, obj.width - 4, Math.floor(obj.height / 2));

        if (seed % 7 === 0) {
            ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            let startXBlock = obj.x + (seed % 20);
            ctx.moveTo(startXBlock, obj.y);
            ctx.lineTo(startXBlock + (seed % 10) - 5, obj.y + obj.height);
            ctx.stroke();
        }

        if (!isTop && seed % 3 === 0) {
            const mossX = obj.x + (seed % (obj.width - 15));
            const mossY = obj.y + (seed % (obj.height - 15));
            
            ctx.fillStyle = "#2d3d1a"; 
            ctx.beginPath();
            ctx.arc(mossX, mossY, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // 3.4. СЛОЙ ИНТЕРАКТИВА
    interactiveLayer.forEach(obj => {
        if (obj.type === "chest") {
            const chest = obj.instance;
            let imageKey;
            if (typeof chest.getImageKey === 'function') {
                imageKey = chest.getImageKey();
            } else {
                imageKey = chest.isOpen ? "chestopen" : "chestunopened";
            }
            const img = assets[imageKey];
            if (img?.complete) ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
        } 
        else if (obj.type === "life_bush" && obj.instance?.draw) {
            obj.instance.draw(ctx, 0, 0);
        } 
        else if (obj.type === "decor_rock") {
            ctx.save();
            const groundOffset = (player && player.size) ? player.size : 20;
            ctx.translate(obj.x, obj.y + groundOffset - 5);
            ctx.rotate(obj.rotation || 0);
            ctx.scale(obj.scale || 1, obj.scale || 1);

            ctx.fillStyle = "#7a7a7a";
            ctx.strokeStyle = "#4a4a4a";
            ctx.lineWidth = 2;

            ctx.beginPath();
            if (obj.points && obj.points.length > 0) {
                ctx.moveTo(obj.points[0].x, obj.points[0].y);
                for (let i = 1; i < obj.points.length; i++) {
                    ctx.lineTo(obj.points[i].x, obj.points[i].y);
                }
            } else {
                ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            if (obj.points && obj.points.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = "rgba(255,255,255,0.2)";
                ctx.lineWidth = 1;
                ctx.moveTo(obj.points[0].x * 0.5, obj.points[0].y * 0.5);
                ctx.lineTo(obj.points[1].x * 0.5, obj.points[1].y * 0.5);
                ctx.stroke();
            }
            ctx.restore();
        }
        else if (obj.type && obj.type.startsWith("village_")) {
            const img = assets[obj.imgKey];
            if (img?.complete && img.naturalHeight !== 0) {
                ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
            } 
        } 
        else if (typeof obj.draw === 'function') {
            obj.draw(ctx, assets); 
        }
        else if (obj.type === "seaweed") {
            const img = assets[obj.imgKey];
            if (img?.complete && img.naturalHeight !== 0) {
                const safeTime = (typeof time === "object" && time !== null) 
                    ? (time.value ?? time.time ?? time.now ?? 0) 
                    : (time || 0);
                const wave = Math.sin(safeTime * 2 + obj.x * 0.05) * 5;

                ctx.drawImage(
                    img, 
                    obj.x + wave, 
                    obj.y, 
                    obj.width, 
                    obj.height
                );
            }
        }
    });

    // 3.5. СТАТУИ
    statuesLayer.forEach(s => s.draw(ctx, assets));

    // --- СЛОЙ 4: ВЫПАВШИЕ ПРЕДМЕТЫ ---
    if (droppedItems && droppedItems.length > 0) {
        droppedItems.forEach(item => {
            const visibleWidthCheck = CONFIG.width / zoomLevel;
            if (item.x + item.size > renderCamX - 50 && 
                item.x < renderCamX + visibleWidthCheck + 50) {
                item.draw(ctx);
            }
        });
    }

    // --- СЛОЙ 4: МОБЫ ---
    if (mobManager) {
        mobManager.draw(ctx); 
    }
    
    // --- СЛОЙ 4.1: МОРСКИЕ ОБИТАТЕЛИ ---
    if (oceanCreatureManager) {
        oceanCreatureManager.draw(ctx, assets, renderCamX, renderCamY);
    }

    // --- СЛОЙ 4.5: ЖИТЕЛИ ДЕРЕВНИ ---
    if (residentManager) {
        residentManager.draw(ctx, renderCamX, visibleWidth);
    }

    // 6. ЗАДНИЙ ФОН КОРАБЛЯ
    const drawShipBack = (s) => s.drawBack(ctx, assets);
    const drawShipFront = (s) => s.drawFront(ctx, assets);

    if (world.cursedShip) {
        drawShipBack(world.cursedShip);
    } else if (world.cursedShipsCandidates) {
        world.cursedShipsCandidates.forEach(drawShipBack);
    }

    // 7. ИГРОК
    ctx.save();
    ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
    ctx.rotate(player.rotation);
    ctx.scale(player.scaleX, player.scaleY);

    ctx.fillStyle = player.color;
    roundRect(ctx, -player.size / 2, -player.size / 2, player.size, player.size, 6);
    ctx.fill();

    const eyeY = -5;
    const look = player.lookX;
    
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(-7, eyeY, 4, 0, Math.PI * 2);
    ctx.arc(7, eyeY, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(-7 + look, eyeY, 2, 0, Math.PI * 2);
    ctx.arc(7 + look, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); 
    
    biomeWeaponManager.draw(ctx, assets);
    nimalManager.draw(ctx, assets)

    if (player.hook && player.hook.active) {
        player.hook.draw(ctx, assets); 
    }

    if (player.inventory && player.inventory.bubbleSlots && player.inventory.bubbleSlots[0]) {
        if (player.bubbleInstance) {
             const itemInside = player.inventory.bubbleSlots[1]; 
             player.bubbleInstance.draw(ctx, assets, itemInside);
        }
    }

    if (petManager) {
        petManager.draw(ctx, { x: renderCamX, y: renderCamY });
    }
    if (player.accessories) {
        player.accessories.render(ctx);
    }

    // 8. ПЕРЕДНИЙ БОРТИК КОРАБЛЯ
    if (world.cursedShip) {
        drawShipFront(world.cursedShip);
    } else if (world.cursedShipsCandidates) {
        world.cursedShipsCandidates.forEach(drawShipFront);
    }

    // --- СЛОЙ 4.2: БОСС КРАКЕН ---
    if (krakenManager && typeof krakenManager.draw === 'function') {
        krakenManager.draw(ctx, assets);
    }

    // 8. ТОРГОВЕЦ
    if (world && merchant?.active) {
        ctx.save();
        ctx.translate(merchant.x + merchant.size / 2, merchant.y - merchant.size / 2);
        ctx.scale(merchant.squashX, merchant.squashY);
        ctx.translate(-(merchant.x + merchant.size / 2), -(merchant.y - merchant.size / 2));

        ctx.fillStyle = "#7b4dff";
        roundRect(ctx, merchant.x, merchant.y - merchant.size, merchant.size, merchant.size, 8);
        ctx.fill();
        ctx.strokeStyle = "#3e2a9e";
        ctx.lineWidth = 2;
        ctx.stroke();

        const mEyeY = merchant.y - merchant.size * 0.65;
        const eyeOffset = merchant.size * 0.25;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(merchant.x + eyeOffset, mEyeY, 4, 0, Math.PI * 2);
        ctx.arc(merchant.x + merchant.size - eyeOffset, mEyeY, 4, 0, Math.PI * 2);
        ctx.fill();

        const lookDX = player.x - (merchant.x + merchant.size / 2);
        const lookDY = player.y - merchant.y;
        const len = Math.hypot(lookDX, lookDY) || 1;
        const lookX = (lookDX / len) * 2;
        const lookY = (lookDY / len) * 2;

        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(merchant.x + eyeOffset + lookX, mEyeY + lookY, 1.5, 0, Math.PI * 2);
        ctx.arc(merchant.x + merchant.size - eyeOffset + lookX, mEyeY + lookY, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#5a2e0f";
        ctx.fillRect(merchant.x - 4, merchant.y - merchant.size - 6, merchant.size + 8, 6);
        ctx.fillStyle = "#8B4513";
        roundRect(ctx, merchant.x + 6, merchant.y - merchant.size - 26, merchant.size - 12, 20, 5);
        ctx.fill();
        ctx.fillStyle = "#ffcc00";
        ctx.fillRect(merchant.x + 8, merchant.y - merchant.size - 18, merchant.size - 16, 4);
        ctx.restore();
    }

// 9. БОСС
    if (boss && boss.isAlive) {
        // Передаем либо импортированный assets, либо глобальный из window
        const activeAssets = assets || window.assets;
        
        if (activeAssets && typeof boss.draw === 'function') {
            boss.draw(ctx, activeAssets); 
        }
    }

// --- СЛОЙ 5: ПЕРЕДНИЙ ПОЛУПРОЗРАЧНЫЙ СЛОЙ ВОДЫ ПОВЕРХ ВСЕХ ОБЪЕКТОВ С ИСКАЖЕНИЕМ ---
    const maxDistForDistortion = 500; // Радиус искажения вокруг игрока в пикселях

    for (let x = startX; x < endX; x += step) {
        const waterData = world.getWaterData(x); 
        
        if (waterData.isWater) {
            const wLevel = waterData.level + player.size;
            const wBottom = waterData.bottom + player.size;
            const safeTime = (typeof time === "object" && time !== null) ? (time.value ?? time.time ?? time.now ?? 0) : (time || 0);

            // Проверяем, находится ли текущий столбец воды рядом с игроком
            const distToPlayer = Math.abs(x - player.x);
            const shouldDistort = distToPlayer < maxDistForDistortion;

            if (waterData.isOcean) {
                const wt = waterData.depthFactor || 0;
                const movingWave = Math.sin(x * 0.03 + safeTime * 3 + (wt * 10));
                const surfaceSway = Math.sin(x * 0.01 + safeTime) * 4;
                let shoreSurge = (wt < 0.3) ? Math.max(0, movingWave) * 15 * (1 - wt / 0.3) : 0;

                const currentWaterY = wLevel + surfaceSway - shoreSurge;
                if (isNaN(currentWaterY)) continue;

                const wr = Math.floor(0 * (1 - wt) + 5 * wt);
                const wg = Math.floor(230 * (1 - wt) + 40 * wt);
                const wb = Math.floor(255 * (1 - wt) + 120 * wt);
                const alpha = 0.35;

                ctx.fillStyle = `rgba(${wr}, ${wg}, ${wb}, ${alpha})`;

                const totalHeight = Math.max(0, wBottom - currentWaterY);

                if (shouldDistort && totalHeight > 0) {
                    // Оптимизированный эффект искажения (только около игрока)
                    const sliceH = 12; // Немного увеличили шаг высоты (с 8 до 12) для еще большей производительности
                    
                    for (let offsetHeight = 0; offsetHeight < totalHeight; offsetHeight += sliceH) {
                        const currentSliceY = currentWaterY + offsetHeight;
                        const distortionX = Math.sin(x * 0.02 + currentSliceY * 0.04 + safeTime * 2.5) * 4;

                        ctx.fillRect(
                            x + distortionX, 
                            currentSliceY, 
                            step + 0.5, 
                            Math.min(sliceH, totalHeight - offsetHeight)
                        );
                    }
                } else {
                    // Быстрая отрисовка без искажений (для заднего плана и оптимизации)
                    ctx.fillRect(x, currentWaterY, step + 0.5, totalHeight);
                }

                // Рисуем пену на самом верху воды
                let foamAlpha = (wt < 0.05) ? 0.7 : (wt < 0.4 && movingWave > 0.8 ? (movingWave - 0.8) * 4 : 0);
                if (foamAlpha > 0) {
                    const foamDistortion = shouldDistort ? Math.sin(x * 0.02 + currentWaterY * 0.04 + safeTime * 2.5) * 4 : 0;
                    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, foamAlpha)})`;
                    ctx.fillRect(x + foamDistortion, currentWaterY - 1, step + 0.5, 5);
                }
            } else {
                // Обычные озера
                let lr = 0, lg = 0, lb = 0, tw = 0;
                const mix = world.getBiomeMix(x);
                for (const key in LAKE_COLORS) {
                    if (mix[key] > 0) {
                        lr += LAKE_COLORS[key][0] * mix[key];
                        lg += LAKE_COLORS[key][1] * mix[key];
                        lb += LAKE_COLORS[key][2] * mix[key];
                        tw += mix[key];
                    }
                }
                if (tw === 0) { lr = 0; lg = 120; lb = 255; }
                ctx.fillStyle = `rgba(${Math.floor(lr)}, ${Math.floor(lg)}, ${Math.floor(lb)}, 0.35)`;

                const totalHeight = Math.max(0, wBottom - wLevel);

                if (shouldDistort && totalHeight > 0) {
                    const sliceH = 12;
                    for (let offsetHeight = 0; offsetHeight < totalHeight; offsetHeight += sliceH) {
                        const currentSliceY = wLevel + offsetHeight;
                        const distortionX = Math.sin(x * 0.03 + currentSliceY * 0.05 + safeTime * 2) * 2.5;

                        ctx.fillRect(
                            x + distortionX, 
                            currentSliceY, 
                            step + 0.5, 
                            Math.min(sliceH, totalHeight - offsetHeight)
                        );
                    }
                } else {
                    ctx.fillRect(x, wLevel, step + 0.5, totalHeight);
                }
            }
        }
    }
    ctx.restore(); 
}

export class CorruptionManager {
    draw(ctx, leftView, rightView, world) { 
        const level = GameState.corruptionLevel;
        if (level === 0) return; 

        ctx.save();
        
        // --- 1. ПЯТНА ПОРЧИ НА ЗЕМЛЕ ---
        const step = level === 1 ? 800 : (level === 2 ? 400 : 200); 
        const startX = Math.floor(leftView / step) * step;

        for (let x = startX; x < rightView; x += step) {
            const seed = Math.sin(x * 0.01) * 10000;
            const random = seed - Math.floor(seed); 

            const chance = level === 1 ? 0.3 : (level === 2 ? 0.6 : 0.9);
            
            if (random < chance) {
                const groundY = world.getHeight(x);
                const radius = (level * 8) + (random * 20); 
                
                ctx.beginPath();
                ctx.arc(x, groundY + 15, radius, 0, Math.PI * 2);
                ctx.fillStyle = level >= 3 ? "#4a004a" : "#2d002d";
                ctx.globalAlpha = 0.8;
                ctx.fill();
            }
        }
        ctx.restore();

        // --- 2. ЗЛОВЕЩИЙ ТУМАН ---
        if (level >= 2) {
            ctx.save();
            if (level === 2) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; 
            } else {
                ctx.fillStyle = "rgba(74, 0, 74, 0.35)"; 
            }
            ctx.fillRect(leftView, -5000, rightView - leftView, 10000);
            ctx.restore();
        }
    }
}