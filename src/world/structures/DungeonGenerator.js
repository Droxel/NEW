//DungeonGenerator.js
import { isLargeBiome } from "../terrain/BiomeMap.js";
import { mobManager } from "../../entities/mobs/MobManager.js";
import { GameState } from "../../core/GameState.js";
const BLOCK_SIZE = 40;
const DUNGEON_SPACING = 15000;

export class DungeonGenerator {
    constructor() {
        this.cache = new Map();
    }

getDungeonBlocksForChunk(chunkX, chunkWidth, world) {
    const blocks = [];
    const chunkEnd = chunkX + chunkWidth;

    const OFFSET = 5500;
    const SPACING = 15000;
    
    const regionX = Math.round((chunkX - OFFSET) / SPACING) * SPACING + OFFSET;

    const dungeonData = this.getDungeonData(regionX, world);
    if (!dungeonData) return blocks;

    for (const rect of dungeonData.rects) {
        // 🛑 ВОТ ЭТА МАГИЯ: если это печать, а босс убит — просто игнорируем этот блок!
        if (rect.type === "jungle_seal" && GameState.bossesDefeated['jungle_boss']) {
            continue; 
        }

        if (rect.x + (rect.w || 40) > chunkX && rect.x < chunkEnd) {
            blocks.push({
                type: rect.type,
                x: rect.x,
                y: rect.y,
                width: rect.w,
                height: rect.h
            });
        }
    }
    return blocks;
}
// Новый метод для синхронизации с world.js
shouldSpawnDungeon(centerX, world) {
    // Если в кэше уже есть запись (null или данные), возвращаем результат
    if (this.cache.has(centerX)) {
        return this.cache.get(centerX) !== null;
    }

    // Все условия в одном месте
    const isJungle = world.getBiome(centerX) === "jungle";
    const isLarge = isLargeBiome(centerX, "jungle", 400);
    const nearWater = world.isWater(centerX);

    const canSpawn = isJungle && isLarge && !nearWater;

    if (!canSpawn) {
        this.cache.set(centerX, null); // Помечаем в кэше, что здесь ничего не будет
    }
    return canSpawn;
}
getDungeonData(centerX, world) {
    if (!this.shouldSpawnDungeon(centerX, world)) {
        // ДОБАВИТЬ ЭТОТ ЛОГ:
        console.log(`[Dungeon] Отмена спавна на X: ${centerX}. (Это джунгли? ${world.getBiome(centerX) === "jungle"})`);
        return null;
    }

    // 2. Если проверка прошла и данные уже в кэше — возвращаем их
    if (this.cache.get(centerX) && this.cache.get(centerX).rects) {
        return this.cache.get(centerX);
    }
console.log(`[Dungeon] 🧱 УСПЕХ! Генерируем данж на X: ${centerX}`);

        const rects = []; 
        const carvedTiles = new Set();
const groundY = world.getHeight(centerX, true); 
const startY = Math.floor(groundY / BLOCK_SIZE) * BLOCK_SIZE;
const startX = Math.floor(centerX / BLOCK_SIZE) * BLOCK_SIZE;
        // Seeded Randomness based on location
        let seed = Math.abs(Math.floor(centerX)); 
        const random = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };

        // --- UTILS ---
        const carve = (x, y) => {
            const gx = Math.floor(x / BLOCK_SIZE) * BLOCK_SIZE;
            const gy = Math.floor(y / BLOCK_SIZE) * BLOCK_SIZE;
            carvedTiles.add(`${gx},${gy}`);
        };

        const carveRect = (x, y, w, h) => {
            for (let iy = 0; iy < h; iy += BLOCK_SIZE) {
                for (let ix = 0; ix < w; ix += BLOCK_SIZE) {
                    carve(x + ix, y + iy);
                }
            }
        };

        // Helper to connect two points with a corridor (L-shaped)
        const connectPoints = (x1, y1, x2, y2, thickness) => {
             // Align to grid
            x1 = Math.floor(x1 / BLOCK_SIZE) * BLOCK_SIZE;
            y1 = Math.floor(y1 / BLOCK_SIZE) * BLOCK_SIZE;
            x2 = Math.floor(x2 / BLOCK_SIZE) * BLOCK_SIZE;
            y2 = Math.floor(y2 / BLOCK_SIZE) * BLOCK_SIZE;

            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);

            // Horizontal segment then Vertical segment
            carveRect(minX, y1, (maxX - minX) + thickness, thickness);
            carveRect(x2, minY, thickness, (maxY - minY) + thickness);
        };

// --- PHASE 1: ENTRANCE ---
// Делаем обычный конус, но за счет того, что startY теперь ниже, 
// верхушка будет на земле, а основание глубоко внутри.
const coneHeight = 25; 
const coneSlope = 1.2; 
const topWidth = 4;    

// Поднимаем верхушку конуса чуть выше нового startY, чтобы она торчала из земли
const topOfConeY = startY - (15 * BLOCK_SIZE); 

for (let i = 0; i < coneHeight; i++) {
    const y = topOfConeY + (i * BLOCK_SIZE);
    const currentHalfWidth = (topWidth / 2 + i * coneSlope) * BLOCK_SIZE;
    
    const rowStartX = startX - currentHalfWidth;
    const rowEndX = startX + currentHalfWidth;

    for (let bx = rowStartX; bx <= rowEndX; bx += BLOCK_SIZE) {
        const distFromCenter = Math.abs(bx - startX);
        if (distFromCenter > BLOCK_SIZE * 1.1) {
            const gx = Math.floor(bx / BLOCK_SIZE) * BLOCK_SIZE;
            const gy = Math.floor(y / BLOCK_SIZE) * BLOCK_SIZE;
            rects.push({ type: "dungeon_wall", x: gx, y: gy, w: BLOCK_SIZE, h: BLOCK_SIZE });
        }
    }
}

// Вырезаем дырку
carveRect(startX - BLOCK_SIZE, topOfConeY, BLOCK_SIZE * 2, coneHeight * BLOCK_SIZE);

// DungeonGenerator.js (внутри метода getDungeonData)

// === ПЕЧАТЬ И СТРАЖИ ===
// 1. Печать (оставляем как есть)
rects.push({ 
    type: "jungle_seal", 
    x: startX - BLOCK_SIZE, 
    y: topOfConeY, 
    w: BLOCK_SIZE * 2, 
    h: BLOCK_SIZE * 2 
});

// 2. Ставим стражей
// Чтобы опустить их ниже: прибавляем к y больше BLOCK_SIZE (например, + 1.5 или + 2)
// Чтобы раздвинуть шире: меняем множители 3.5 и 1.5 на бóльшие числа

const guardsY = topOfConeY + (BLOCK_SIZE * 2); // Опускаем на 2 блока ниже верхушки печати
const spread = 5.5; // Коэффициент разлета (было примерно 3.5 и 1.5)

rects.push({ 
    type: "jungle_guard_left", 
    x: startX - BLOCK_SIZE * spread, // Уехал дальше влево
    y: guardsY, 
    w: BLOCK_SIZE, h: BLOCK_SIZE 
});

rects.push({ 
    type: "jungle_guard_right", 
    x: startX + BLOCK_SIZE * (spread - 1), // Уехал дальше вправо
    y: guardsY, 
    w: BLOCK_SIZE, h: BLOCK_SIZE 
});
// --- PHASE 2: DESCENT ---
let currX = startX;
// Начинаем спуск от конца конуса
let currY = topOfConeY + (coneHeight * BLOCK_SIZE); 
const tunnelThick = BLOCK_SIZE * 3; 

const stepCount = 18 + Math.floor(random() * 5); 
let direction = random() < 0.5 ? -1 : 1;

for (let i = 0; i < stepCount; i++) {
    const stepH = BLOCK_SIZE * 4; // Длина ступеньки
    const stepV = BLOCK_SIZE * 1; // Высота спуска
    
    const targetX = currX + stepH * direction;

    // Рисуем горизонтальную часть
    // Используем Math.min, чтобы всегда рисовать слева направо
    const minX = Math.min(currX, targetX);
    carveRect(minX, currY, Math.abs(targetX - currX) + tunnelThick, tunnelThick);
    
    // Обновляем X перед спуском
    currX = targetX;

    // Рисуем вертикальный спуск
    // Он начинается ровно там, где закончился горизонтальный, без "вылетов" в стороны
    carveRect(currX, currY, tunnelThick, stepV + tunnelThick);
    
    currY += stepV;

    if (random() < 0.15) direction *= -1;
}

// --- PHASE 2.5: SMART SNAKE DESCENT (Чистим здесь тоже) ---
const snakeLevels = 4 + Math.floor(random() * 3); 

for (let i = 0; i < snakeLevels; i++) {
    const hLen = BLOCK_SIZE * (10 + random() * 8);
    const vTotalLen = BLOCK_SIZE * (6 + random() * 4);
    const targetX = currX + (hLen * direction);
    
    // Горизонтальный сегмент
    carveRect(Math.min(currX, targetX), currY, Math.abs(targetX - currX) + tunnelThick, tunnelThick);
    currX = targetX;

    if (random() > 0.2) { 
        // Пологая лестница
        let remainingV = vTotalLen;
        while (remainingV > 0) {
            // Вертикальный шаг (ровно по сетке)
            carveRect(currX, currY, tunnelThick, BLOCK_SIZE + tunnelThick);
            currY += BLOCK_SIZE;
            remainingV -= BLOCK_SIZE;
            
            // Горизонтальный шаг
            const nextX = currX + (BLOCK_SIZE * 2) * direction;
            carveRect(Math.min(currX, nextX), currY, (BLOCK_SIZE * 2) + tunnelThick, tunnelThick);
            currX = nextX;
        }
    } else {
        // Прямая вертикальная шахта (ровные края)
        carveRect(currX, currY, tunnelThick, vTotalLen + tunnelThick);
        currY += vTotalLen;
    }
    direction *= -1;
}
// --- PHASE 3: GRID MAZE (УЛУЧШЕННЫЙ) ---
const mazeStartX = currX;
const mazeStartY = currY;

const GRID_W = 12; // Сделаем чуть шире
const GRID_H = 8;  // И чуть ниже, чтобы не карабкаться долго
const CELL_PIXEL_SIZE = BLOCK_SIZE * 16; 

const grid = Array(GRID_H).fill().map(() => Array(GRID_W).fill(false));
const adj = new Map(); 

let gx = Math.floor(GRID_W / 2);
let gy = 0;
let stack = [{x: gx, y: gy}];
grid[gy][gx] = true;

const addEdge = (p1, p2) => {
    const k1 = `${p1.x},${p1.y}`;
    const k2 = `${p2.x},${p2.y}`;
    if (!adj.has(k1)) adj.set(k1, []);
    if (!adj.has(k2)) adj.set(k2, []);
    // Проверка, чтобы не дублировать ребра
    if (!adj.get(k1).some(p => p.x === p2.x && p.y === p2.y)) {
        adj.get(k1).push(p2);
        adj.get(k2).push(p1);
    }
};

const getNeighbors = (x, y) => {
    const n = [];
    // Приоритеты: влево, вправо, вниз и очень редко вверх
    const dirs = [
        {x: -1, y: 0, weight: 4}, // Лево
        {x: 1, y: 0, weight: 4},  // Право
        {x: 0, y: 1, weight: 3},  // Вниз
        {x: 0, y: -1, weight: 1}  // Вверх (самый низкий шанс)
    ];
    
    for (let d of dirs) {
        const nx = x + d.x, ny = y + d.y;
        if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H && !grid[ny][nx]) {
            // Добавляем направление несколько раз в массив согласно весу
            for(let i = 0; i < d.weight; i++) n.push({x: nx, y: ny});
        }
    }
    return n;
};

// Генерируем основной путь
let bottomNode = {x: gx, y: gy};
while(stack.length) {
    const curr = stack[stack.length-1];
    if (curr.y > bottomNode.y) bottomNode = {...curr};

    const ns = getNeighbors(curr.x, curr.y);
    if (ns.length) {
        const next = ns[Math.floor(random() * ns.length)];
        addEdge(curr, next);
        grid[next.y][next.x] = true;
        stack.push(next);
    } else {
        stack.pop();
    }
}

// --- ДОБАВЛЯЕМ ПЕТЛИ (Чтобы были выходы по бокам) ---
// Проходим по сетке и с шансом 30% соединяем соседние по горизонтали комнаты
for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W - 1; x++) {
        if (grid[y][x] && grid[y][x+1] && random() < 0.3) {
            addEdge({x, y}, {x: x + 1, y});
        }
    }
}

// --- PHASE 4: RENDER MAZE ---
const gridOriginX = mazeStartX - (gx * CELL_PIXEL_SIZE); 
const gridOriginY = mazeStartY;
const drawnEdges = new Set(); 

for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
        const k = `${x},${y}`;
        if (!grid[y][x]) continue;

        const cx = gridOriginX + x * CELL_PIXEL_SIZE;
        const cy = gridOriginY + y * CELL_PIXEL_SIZE;
        
        // 1. СНАЧАЛА РИСУЕМ КОМНАТУ И СПАВНИМ МОБА
        if (x === bottomNode.x && y === bottomNode.y) {
            // ФИНАЛЬНАЯ КОМНАТА
            const roomW = BLOCK_SIZE * 35; 
            const roomH = BLOCK_SIZE * 20;
            carveRect(cx - roomW/2, cy - roomH/2, roomW, roomH);
            rects.push({ type: "blue_block", x: cx - BLOCK_SIZE, y: cy - BLOCK_SIZE, w: BLOCK_SIZE*2, h: BLOCK_SIZE*2 });
            
            // В босс-руме спавним 3 скелета гарантированно
            for(let i = 0; i < 3; i++) {
                mobManager.spawnDungeonMob(cx + (i * 60) - 60, cy);
            }
        } else {
            // ОБЫЧНАЯ КОМНАТА
            const roomW = BLOCK_SIZE * (10 + Math.floor(random() * 8));
            const roomH = BLOCK_SIZE * (6 + Math.floor(random() * 4));
            carveRect(cx - roomW/2, cy - roomH/2, roomW, roomH);

            // --- ВОТ ТУТ ПРАВИЛЬНЫЙ СПАВН ---
            // Спавним одного скелета в центре комнаты с шансом 40%
if (random() < 0.4) {
    // Спавним на 40 пикселей выше центра комнаты, чтобы точно не в полу
    mobManager.spawnDungeonMob(cx, cy - 40); 
}
        }

        // 2. ПОТОМ РИСУЕМ КОРИДОРЫ (БЕЗ СПАВНА ВНУТРИ НИХ!)
        const neighbors = adj.get(k) || [];
        for (const n of neighbors) {
            const edgeKey = [k, `${n.x},${n.y}`].sort().join('-');
            if (drawnEdges.has(edgeKey)) continue;
            drawnEdges.add(edgeKey);

            const ncx = gridOriginX + n.x * CELL_PIXEL_SIZE;
            const ncy = gridOriginY + n.y * CELL_PIXEL_SIZE;
            const thick = BLOCK_SIZE * 3;

            if (n.x !== x) {
                carveRect(Math.min(cx, ncx), cy - thick/2, Math.abs(ncx - cx) + thick, thick);
            } else {
                carveRect(cx - thick/2, Math.min(cy, ncy), thick, Math.abs(ncy - cy) + thick);
            }
        }
    }
}
        // Connect Snake End to Grid Start (Just in case of slight misalignment)
        connectPoints(currX, currY, mazeStartX, mazeStartY, BLOCK_SIZE * 3);


// --- PHASE 5: BG OPTIMIZATION (Greedy Meshing) ---
        const finalTiles = [];
        carvedTiles.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            finalTiles.push({x, y});
        });
        
        // Sort for meshing
        finalTiles.sort((a, b) => (a.y - b.y) || (a.x - b.x));

        // Generate BG Rects (Walkable Space)
        if (finalTiles.length > 0) {
            let currentRect = { ...finalTiles[0], w: BLOCK_SIZE };
            for (let i = 1; i < finalTiles.length; i++) {
                const tile = finalTiles[i];
                if (tile.y === currentRect.y && tile.x === currentRect.x + currentRect.w) {
                    currentRect.w += BLOCK_SIZE; 
                } else {
                    // Разделяем тип фона: верхний или нижний
                    const bgType = (currentRect.y < startY) ? "dungeon_bg_smooth" : "dungeon_bg";
                    rects.push({ type: bgType, x: currentRect.x, y: currentRect.y, w: currentRect.w, h: BLOCK_SIZE });
                    currentRect = { x: tile.x, y: tile.y, w: BLOCK_SIZE };
                }
            }
            const bgType = (currentRect.y < startY) ? "dungeon_bg_smooth" : "dungeon_bg";
            rects.push({ type: bgType, x: currentRect.x, y: currentRect.y, w: currentRect.w, h: BLOCK_SIZE });
        }

// --- PHASE 6: WALL GENERATION (FIXED) ---
const wallSet = new Set();
carvedTiles.forEach(tileKey => {
    const [tx, ty] = tileKey.split(',').map(Number);
    const neighbors = [
        {dx: -BLOCK_SIZE, dy: 0}, {dx: BLOCK_SIZE, dy: 0},
        {dx: 0, dy: -BLOCK_SIZE}, {dx: 0, dy: BLOCK_SIZE}
    ];

    neighbors.forEach(n => {
        const nx = tx + n.dx;
        const ny = ty + n.dy;
        const nKey = `${nx},${ny}`;

        // Если соседа нет в вырезанных и в списке уже существующих стен
        if (!carvedTiles.has(nKey) && !rects.some(r => r.x === nx && r.y === ny && r.type.includes("wall"))) {
            wallSet.add(nKey);
        }
    });
});

wallSet.forEach(key => {
    const [wx, wy] = key.split(',').map(Number);
    const type = (wy < startY) ? "dungeon_wall_smooth" : "dungeon_wall";
    rects.push({ type: type, x: wx, y: wy, w: BLOCK_SIZE, h: BLOCK_SIZE });
});

        const result = { rects };
        this.cache.set(centerX, result);
        return result;
    }
} 