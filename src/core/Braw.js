//Braw.js
import { CONFIG } from "../data/config.js";
import { MerchantUI } from "../ui/screens/MerchantUI.js"; // Проверь название переменной
import { bossManager } from "../entities/bosses/BossManager.js";
import { assets } from "./AssetLoader.js"; 
import { merchant } from "../entities/npcs/Merchant.js";
import { residentManager } from "../entities/npcs/residents/ResidentManager.js";
import { GameState } from "../core/GameState.js";
import { biomeWeaponManager } from "../entities/weapons/BiomeWeapon.js";

// Переэкспортируем assets, чтобы main.js мог их видеть через этот файл
export { assets };

// КАМЕРА
export let cameraX = 0;
export let cameraY = 0;

// Вспомогательная функция для рисования закругленных прямоугольников
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

// Флаг для отладки (чтобы консоль не спамило)
let hasLoggedTrees = false;
let hasLoggedDungeon = false; 

// --- ОСНОВНАЯ ФУНКЦИЯ ОТРИСОВКИ ---
export function Braw(ctx, player, world, time, boss, sky, bgManager, petManager, mobManager) {
    // 1. ПЛАВНОЕ ДВИЖЕНИЕ КАМЕРЫ (LERP)
    const targetCameraX = player.x - CONFIG.width / 2;
    const targetCameraY = player.y - CONFIG.height / 2;

    cameraX += (targetCameraX - cameraX) * 0.1;
    cameraY += (targetCameraY - cameraY) * 0.1;

    const renderCamX = Math.floor(cameraX);
    const renderCamY = Math.floor(cameraY);

    // 2. НЕБО
    if (sky) sky.draw(ctx, time);

    // 3. ФОНЫ (ПАРАЛЛАКС)
    if (bgManager) bgManager.draw(ctx, assets, renderCamX, renderCamY);

    ctx.save();
    ctx.translate(-renderCamX, -renderCamY);

    // 4. ПОДГОТОВКА ЧАНКОВ
    const startChunk = world.chunkManager.getChunkId(renderCamX - 200);
    const endChunk = world.chunkManager.getChunkId(renderCamX + CONFIG.width + 200);

    // --- СЛОЙ 1: ДЕРЕВЬЯ (За землей) ---
    for (let i = startChunk; i <= endChunk; i++) {
        const chunk = world.chunkManager.getChunk(i * (CONFIG.chunkSize || 1024));
        if (!chunk?.objects) continue;

        chunk.objects.forEach(obj => {
            if (obj.type === "tree") {
                if (obj.x + obj.width < renderCamX || obj.x > renderCamX + CONFIG.width) return;
                const img = assets[obj.imgKey];
                const drawY = (obj.y + player.size) - obj.height + 45;
                if (img?.complete && img.naturalHeight !== 0) {
                    ctx.drawImage(img, obj.x, drawY, obj.width, obj.height);
                }
            }
        });
    }

    // --- СЛОЙ 2: ЗЕМЛЯ И ВОДЫ ---
    const startX = renderCamX;
    const endX = renderCamX + CONFIG.width + 1;
    const step = 8; 
    const DUNGEON_SPACING = 15000;
    const entranceWidth = 60; 

    for (let x = startX; x < endX; x += step) {
        const groundY = world.getHeight(x, true); 
        const dungeonCenter = Math.round(x / DUNGEON_SPACING) * DUNGEON_SPACING;
        const isEntrance = Math.abs(x - dungeonCenter) < entranceWidth;
        const biome = world.getBiome(x);

        if (isEntrance && biome === 'jungle') {
            ctx.fillStyle = "#1a1a1a"; 
            ctx.fillRect(x, groundY + player.size, step + 0.5, 30000);
            continue; 
        }

        const mix = world.getBiomeMix(x);
        const waterData = world.getWaterData(x);

        const r = Math.floor((255*mix.desert)+(92*mix.plains)+(63*mix.forest)+(47*mix.jungle)+(255*mix.snow) + (100 * mix.village) + (74 * mix.corruption));
        const g = Math.floor((248*mix.desert)+(138*mix.plains)+(107*mix.forest)+(79*mix.jungle)+(255*mix.snow) + (160 * mix.village) + (0 * mix.corruption));
        const b = Math.floor((109*mix.desert)+(58*mix.plains)+(42*mix.forest)+(47*mix.jungle)+(255*mix.snow) + (60 * mix.village) + (130 * mix.corruption));

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, groundY + player.size, step + 0.5, 30000);

        if (waterData.isWater) {
            const wLevel = waterData.level + player.size;
            const realTerrainBottom = waterData.bottom + player.size; 
            
            if (realTerrainBottom > wLevel) {
                const c_desert     = [100, 200, 255]; 
                const c_plains     = [0, 120, 255];  
                const c_forest     = [20, 100, 200]; 
                const c_jungle     = [50, 180, 100]; 
                const c_snow       = [180, 230, 255];
                const c_village    = [0, 150, 255];  
                const c_corruption = [80, 0, 120];   

                const wr = (c_desert[0] * mix.desert) + (c_plains[0] * mix.plains) + 
                           (c_forest[0] * mix.forest) + (c_jungle[0] * mix.jungle) + 
                           (c_snow[0] * mix.snow) + (c_village[0] * mix.village) + 
                           (c_corruption[0] * mix.corruption);

                const wg = (c_desert[1] * mix.desert) + (c_plains[1] * mix.plains) + 
                           (c_forest[1] * mix.forest) + (c_jungle[1] * mix.jungle) + 
                           (c_snow[1] * mix.snow) + (c_village[1] * mix.village) + 
                           (c_corruption[1] * mix.corruption);

                const wb = (c_desert[2] * mix.desert) + (c_plains[2] * mix.plains) + 
                           (c_forest[2] * mix.forest) + (c_jungle[2] * mix.jungle) + 
                           (c_snow[2] * mix.snow) + (c_village[2] * mix.village) + 
                           (c_corruption[2] * mix.corruption);

                ctx.fillStyle = `rgba(${Math.floor(wr)}, ${Math.floor(wg)}, ${Math.floor(wb)}, 0.6)`;
                ctx.fillRect(x, wLevel, step + 0.5, (realTerrainBottom - wLevel) + 0.5);
            }
        }
    }

    // --- СЛОЙ 2.5: ПЯТНА ПОРЧИ ---
    if (world.corruptionManager) {
        world.corruptionManager.draw(ctx, renderCamX, renderCamX + CONFIG.width, world); 
    }

    // --- СЛОЙ 3: ДАНЖ И ИНТЕРАКТИВ (ГЛОБАЛЬНАЯ СОРТИРОВКА ПО СЛОЯМ) ---
    // Собираем ВСЕ объекты со всех видимых чанков вместе
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
                if (obj.x + objWidth < renderCamX || obj.x > renderCamX + CONFIG.width) return;

                if (obj.type === "dungeon_bg" || obj.type === "dungeon_bg_smooth") {
                    bgLayer.push(obj);
                } else if (obj.type === "boss_torch" || obj.type === "boss_pillar") {
                    decoLayer.push(obj);
                } else if (obj.type === "dungeon_wall" || obj.type === "dungeon_wall_smooth" || obj.type === "blue_block") {
                    wallLayer.push(obj);
                } else if (obj.type !== "tree") {
                    interactiveLayer.push(obj);
                }
            });
        }

        if (chunk.statues) {
            chunk.statues.forEach(s => statuesLayer.push(s));
        }
    }

    // ТЕПЕРЬ РИСУЕМ СТРОГО ПО СЛОЯМ (Порядок гарантирует, что фон данжа будет самым задним)

    // 3.1. СЛОЙ ФОНА ДАНЖА (Ложится сразу на землю)
    bgLayer.forEach(obj => {
        const isTop = obj.type === "dungeon_bg_smooth";
        ctx.fillStyle = isTop ? "#2a2a24" : "#1a1e15"; 
        ctx.fillRect(obj.x, obj.y, obj.width + 1, obj.height + 1);
        
        ctx.strokeStyle = isTop ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.2)";
        ctx.lineWidth = 2;
        
        const step = 80; 
        ctx.beginPath(); 
        for (let bx = 0; bx < obj.width; bx += step) {
            for (let by = 0; by < obj.height; by += step) {
                if ((bx + by) % 3 === 0) { 
                    ctx.moveTo(obj.x + bx, obj.y + by + step);
                    ctx.lineTo(obj.x + bx + step / 2, obj.y + by + step);
                }
            }
        }
        ctx.stroke(); 
    });

    // 3.2. СЛОЙ ДЕКОРАЦИЙ (Колонны, Факелы поверх фона)
    decoLayer.forEach(obj => {
        if (typeof obj.draw === 'function') {
            obj.draw(ctx, assets); 
        }
    });

    // 3.3. СЛОЙ СТЕН (Перекрывают фон и низ колонн)
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
            let startX = obj.x + (seed % 20);
            ctx.moveTo(startX, obj.y);
            ctx.lineTo(startX + (seed % 10) - 5, obj.y + obj.height);
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

    // 3.4. СЛОЙ ИНТЕРАКТИВА (Сундуки, кусты, домики)
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
        else if (obj.type && obj.type.startsWith("village_")) {
            const img = assets[obj.imgKey];
            if (img?.complete && img.naturalHeight !== 0) {
                ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
            } 
        } 
        else if (typeof obj.draw === 'function') {
            obj.draw(ctx, assets); 
        }
    });

    // 3.5. СТАТУИ (Самый верхний слой чанка)
    statuesLayer.forEach(s => s.draw(ctx, assets));

    // --- СЛОЙ 4: МОБЫ ---
    if (mobManager) {
        mobManager.draw(ctx); 
    }

    // --- СЛОЙ 4.5: ЖИТЕЛИ ДЕРЕВНИ ---
    if (residentManager) {
        residentManager.draw(ctx, renderCamX, CONFIG.width);
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
        petManager.draw(ctx);
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
        boss.draw(ctx, assets); 
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