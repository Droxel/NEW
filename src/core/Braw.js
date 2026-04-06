//Braw.js
import { CONFIG } from "../data/config.js";
import { MerchantUI } from "../ui/screens/MerchantUI.js"; // Проверь название переменной
import { bossManager } from "../entities/bosses/BossManager.js";
import { assets } from "./AssetLoader.js"; 
import { merchant } from "../entities/npcs/Merchant.js";
import { residentManager } from "../entities/npcs/residents/ResidentManager.js";
import { GameState } from "../core/GameState.js";
import { biomeWeaponManager } from "../entities/weapons/BiomeWeapon.js"; // ТЕПЕРЬ ПРАВИЛЬНО
// Переэкспортируем assets, чтобы main.js мог их видеть через этот файл
export { assets };

//  КАМЕРА
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
let hasLoggedDungeon = false; // Флаг, чтобы не спамить
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
    const entranceWidth = 60; // <--- ВОТ ЭТО ВЕРНУЛИ

    for (let x = startX; x < endX; x += step) {
        // Оставляем true, чтобы поверхность рисовалась ровной!
        const groundY = world.getHeight(x, true); 
        const dungeonCenter = Math.round(x / DUNGEON_SPACING) * DUNGEON_SPACING;
        const isEntrance = Math.abs(x - dungeonCenter) < entranceWidth;
        const biome = world.getBiome(x);

        if (isEntrance && biome === 'jungle') {
            ctx.fillStyle = "#1a1a1a"; // Фон шахты
            // ВОТ ТУТ МЕНЯЕМ 5000 на 30000
            ctx.fillRect(x, groundY + player.size, step + 0.5, 30000);
            continue; // Не рисуем землю там, где вход
        }

const mix = world.getBiomeMix(x);
const waterData = world.getWaterData(x);

// 👇 ДОБАВЛЯЕМ ЦВЕТ ПОРЧИ (Темно-фиолетовый: RGB 74, 0, 130)
const r = Math.floor((255*mix.desert)+(92*mix.plains)+(63*mix.forest)+(47*mix.jungle)+(255*mix.snow) + (100 * mix.village) + (74 * mix.corruption));
const g = Math.floor((248*mix.desert)+(138*mix.plains)+(107*mix.forest)+(79*mix.jungle)+(255*mix.snow) + (160 * mix.village) + (0 * mix.corruption));
const b = Math.floor((109*mix.desert)+(58*mix.plains)+(42*mix.forest)+(47*mix.jungle)+(255*mix.snow) + (60 * mix.village) + (130 * mix.corruption));

ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
ctx.fillRect(x, groundY + player.size, step + 0.5, 30000);

if (waterData.isWater) {
    const wLevel = waterData.level + player.size;
    const realTerrainBottom = world.getHeight(x, true) + player.size; 
    
    if (realTerrainBottom > wLevel) {
        // --- 1. ОПРЕДЕЛЯЕМ ЦВЕТА ВОДЫ ДЛЯ БИОМОВ ---
        // Цвета в формате [R, G, B]
        const c_desert     = [100, 200, 255]; // Бирюзовая
        const c_plains     = [0, 120, 255];   // Обычная синяя
        const c_forest     = [20, 100, 200];  // Глубокая синяя
        const c_jungle     = [50, 180, 100];  // Грязновато-зеленая
        const c_snow       = [180, 230, 255]; // Светло-ледяная
        const c_village    = [0, 150, 255];   // Чистая голубая
        const c_corruption = [80, 0, 120];    // Фиолетовая (порча)

        // --- 2. СМЕШИВАЕМ ЦВЕТА (как у земли) ---
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

        // --- 3. ПРИМЕНЯЕМ ---
        // 0.6 — это прозрачность (alpha). Можешь подкрутить под себя.
        ctx.fillStyle = `rgba(${Math.floor(wr)}, ${Math.floor(wg)}, ${Math.floor(wb)}, 0.6)`;
        
        // Рисуем сам блок воды
        ctx.fillRect(x, wLevel, step + 0.5, (realTerrainBottom - wLevel) + 0.5);
    }
}
    }
    // 👇 ДОБАВЛЯЕМ ЭТОТ БЛОК 👇
    // --- СЛОЙ 2.5: ПЯТНА ПОРЧИ ---
if (world.corruptionManager) {
    // Передаем world, чтобы менеджер знал высоту земли
    world.corruptionManager.draw(ctx, renderCamX, renderCamX + CONFIG.width, world); 
}
// --- СЛОЙ 3: ДАНЖ И ИНТЕРАКТИВ (Улучшенный визуал) ---
for (let i = startChunk; i <= endChunk; i++) {
    const chunk = world.chunkManager.getChunk(i * (CONFIG.chunkSize || 1024));
    if (!chunk?.objects) continue;

    chunk.objects.forEach(obj => {
        if (obj.x + (obj.width || 0) < renderCamX || obj.x > renderCamX + CONFIG.width) return;

        // Используем координаты для "стабильной" случайности (объявляем один раз)
        const seed = (obj.x * 3421 + obj.y * 1234);

        if (obj.type === "dungeon_wall" || obj.type === "dungeon_wall_smooth") {
            const isTop = obj.type === "dungeon_wall_smooth";
            
            // 1. Цвет: сверху сухой песчано-серый, снизу - темный мшистый
            ctx.fillStyle = isTop ? "#636353" : "#4a4f3d"; 
            ctx.fillRect(obj.x, obj.y, obj.width + 1, obj.height + 1);

            // 2. Блик (чтобы блок не казался совсем плоским)
            ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
            ctx.fillRect(obj.x + 2, obj.y + 2, obj.width - 4, Math.floor(obj.height / 2));

            // 3. Редкие и очень тусклые трещины
            if (seed % 7 === 0) {
                ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                let startX = obj.x + (seed % 20);
                ctx.moveTo(startX, obj.y);
                ctx.lineTo(startX + (seed % 10) - 5, obj.y + obj.height);
                ctx.stroke();
            }

            // 4. Мох рисуем ТОЛЬКО под землей
            if (!isTop && seed % 3 === 0) {
                const mossX = obj.x + (seed % (obj.width - 15));
                const mossY = obj.y + (seed % (obj.height - 15));
                
                ctx.fillStyle = "#2d3d1a"; 
                ctx.beginPath();
                ctx.arc(mossX, mossY, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        } 
        else if (obj.type === "dungeon_bg" || obj.type === "dungeon_bg_smooth") {
            const isTop = obj.type === "dungeon_bg_smooth";
            
            // Фон: спокойный, темный
            ctx.fillStyle = isTop ? "#2a2a24" : "#1a1e15"; 
            ctx.fillRect(obj.x, obj.y, obj.width + 1, obj.height + 1);
            
            ctx.strokeStyle = isTop ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.2)";
            ctx.lineWidth = 2;
            
const step = 80; 
            ctx.beginPath(); // Открываем путь ОДИН РАЗ до цикла
            for (let bx = 0; bx < obj.width; bx += step) {
                for (let by = 0; by < obj.height; by += step) {
                    if ((bx + by) % 3 === 0) { 
                        ctx.moveTo(obj.x + bx, obj.y + by + step);
                        ctx.lineTo(obj.x + bx + step / 2, obj.y + by + step);
                    }
                }
            }
            ctx.stroke(); // Рисуем все линии за ОДИН вызов
        }
        else if (obj.type === "chest") {
            const chest = obj.instance;
            let imageKey;
            if (typeof chest.getImageKey === 'function') {
                imageKey = chest.getImageKey();
            } else {
                imageKey = chest.isOpen ? "chestopen" : "chestunopened";
            }

            const img = assets[imageKey];
            if (img?.complete) {
                ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
            }
        }
        else if (obj.type === "life_bush" && obj.instance?.draw) {
            obj.instance.draw(ctx, 0, 0);
        }
        else if (obj.type && obj.type.startsWith("village_")) {
            const img = assets[obj.imgKey];
            if (img?.complete && img.naturalHeight !== 0) {
                ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
            } // Было пропущено
        } // Было пропущено
    });

    if (chunk.statues) {
        chunk.statues.forEach(s => s.draw(ctx, assets));
    }
}

// --- СЛОЙ 4: МОБЫ ---
if (mobManager) {
    mobManager.draw(ctx); 
}
// --- СЛОЙ 4.5: ЖИТЕЛИ ДЕРЕВНИ ---
if (residentManager) {
    // Передаем контекст, позицию камеры и ширину экрана (из CONFIG)
    residentManager.draw(ctx, renderCamX, CONFIG.width);
}

    // 7. ИГРОК
    ctx.save();
    // Перемещаемся в центр игрока
    ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
    ctx.rotate(player.rotation);
    ctx.scale(player.scaleX, player.scaleY);

    // Рисуем тело
    ctx.fillStyle = player.color;
    roundRect(ctx, -player.size / 2, -player.size / 2, player.size, player.size, 6);
    ctx.fill();

    // Рисуем глаза
    const eyeY = -5;
    const look = player.lookX;
    
    // Белки глаз
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(-7, eyeY, 4, 0, Math.PI * 2);
    ctx.arc(7, eyeY, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Зрачки
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(-7 + look, eyeY, 2, 0, Math.PI * 2);
    ctx.arc(7 + look, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Возвращаем контекст (чтобы пузырь и оружие не вращались вместе с игроком при прыжке)
    
    biomeWeaponManager.draw(ctx, assets);
    // --- НОВОЕ: ОТРИСОВКА КРЮКА-КОШКИ ---
    // Рисуем его сразу после игрока, чтобы веревка была поверх всего
    if (player.hook && player.hook.active) {
        player.hook.draw(ctx, assets); 
    }
    // --- ПУЗЫРЬ ИНВЕНТАРЯ (Над игроком) ---
    if (player.inventory && player.inventory.bubbleSlots && player.inventory.bubbleSlots[0]) {
        // Предполагаем, что bubbleInstance есть у игрока, или создаем его на лету, 
        // но лучше использовать player.bubbleInstance, если он создан в main.js/player.js
        if (player.bubbleInstance) {
             const itemInside = player.inventory.bubbleSlots[1]; 
             player.bubbleInstance.draw(ctx, assets, itemInside);
        }
    }
    // --- РИСУЕМ ПРИЗРАКА ТУТ (Внутри камеры) ---
    if (petManager) {
        petManager.draw(ctx);
    }
     //  8. ТОРГОВЕЦ
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

    // 9. БОСС (Если есть)
    if (boss && boss.isAlive) {
        boss.draw(ctx, assets); // Передаем assets боссу, вдруг пригодятся
    }

    ctx.restore(); // ВОЗВРАЩАЕМ КОНТЕКСТ КАМЕРЫ В НАЧАЛО


}
export class CorruptionManager {
    // Нам больше не нужен constructor и массив spots!
    
draw(ctx, leftView, rightView, world) { 
    const level = GameState.corruptionLevel;
        if (level === 0) return; // Нет порчи - нет проблем

        ctx.save();
        
        // --- 1. ПЯТНА ПОРЧИ НА ЗЕМЛЕ ---
        // Шаг генерации: чем выше уровень, тем плотнее пятна
        const step = level === 1 ? 800 : (level === 2 ? 400 : 200); 
        const startX = Math.floor(leftView / step) * step;

        for (let x = startX; x < rightView; x += step) {
            // Создаем псевдослучайность на основе координаты X, чтобы пятна не прыгали
            const seed = Math.sin(x * 0.01) * 10000;
            const random = seed - Math.floor(seed); 

            // Вероятность появления
            const chance = level === 1 ? 0.3 : (level === 2 ? 0.6 : 0.9);
            
            if (random < chance) {
                const groundY = world.getHeight(x);
                // Размер пятна растет с уровнем
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
                ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; // Легкая тьма
            } else {
                ctx.fillStyle = "rgba(74, 0, 74, 0.35)"; // Густая фиолетовая дымка
            }
            ctx.fillRect(leftView, -5000, rightView - leftView, 10000);
            ctx.restore();
        }
    }
}