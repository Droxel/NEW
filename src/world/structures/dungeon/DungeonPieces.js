//DungeonPieces.js
import { BLOCK_SIZE } from './DungeonCarver.js';
import { GameState } from "../../../core/GameState.js";
import { mobManager } from "../../../entities/mobs/MobManager.js";
import { bossManager } from "../../../entities/bosses/BossManager.js";

// --- ЭТОЙ ФУНКЦИИ НЕ ХВАТАЛО ---
export function buildEntrance(carver, startX, topOfConeY) {
    const coneHeight = 25;  
    const coneSlope = 1.2;  
    const topWidth = 4;     

    // Генерация конусообразного входа (стенки)
    for (let i = 0; i < coneHeight; i++) {
        const y = topOfConeY + (i * BLOCK_SIZE);
        const currentHalfWidth = (topWidth / 2 + i * coneSlope) * BLOCK_SIZE;
        
        const rowStartX = startX - currentHalfWidth;
        const rowEndX = startX + currentHalfWidth;

        for (let bx = rowStartX; bx <= rowEndX; bx += BLOCK_SIZE) {
            const distFromCenter = Math.abs(bx - startX);
            // Оставляем проход по центру (чуть шире BLOCK_SIZE)
            if (distFromCenter > BLOCK_SIZE * 1.1) {
                const gx = Math.floor(bx / BLOCK_SIZE) * BLOCK_SIZE;
                const gy = Math.floor(y / BLOCK_SIZE) * BLOCK_SIZE;
                carver.addRect({ type: "dungeon_wall", x: gx, y: gy, w: BLOCK_SIZE, h: BLOCK_SIZE });
            }
        }
    }

    // Вырезаем пустоту внутри конуса для прохода
    carver.carveRect(startX - BLOCK_SIZE, topOfConeY, BLOCK_SIZE * 2, coneHeight * BLOCK_SIZE);

    // Добавляем печать джунглей на входе
    carver.addRect({ 
        type: "jungle_seal", x: startX - BLOCK_SIZE, y: topOfConeY, 
        w: BLOCK_SIZE * 2, h: BLOCK_SIZE * 2 
    });

    // Стражи у входа
    const guardsY = topOfConeY + (BLOCK_SIZE * 2);  
    const spread = 5.5;  

    carver.addRect({ type: "jungle_guard_left", x: startX - BLOCK_SIZE * spread, y: guardsY, w: BLOCK_SIZE, h: BLOCK_SIZE });
    carver.addRect({ type: "jungle_guard_right", x: startX + BLOCK_SIZE * (spread - 1), y: guardsY, w: BLOCK_SIZE, h: BLOCK_SIZE });
}

export function buildDescent(carver, startX, startY, random) {
    let currX = startX;
    let currY = startY;  
    const tunnelThick = BLOCK_SIZE * 3;  

    const stepCount = 18 + Math.floor(random() * 5);  
    let direction = random() < 0.5 ? -1 : 1;

    for (let i = 0; i < stepCount; i++) {
        const stepH = BLOCK_SIZE * 4;  
        const stepV = BLOCK_SIZE * 1;  
        const targetX = currX + stepH * direction;

        const minX = Math.min(currX, targetX);
        carver.carveRect(minX, currY, Math.abs(targetX - currX) + tunnelThick, tunnelThick);
        currX = targetX;
        carver.carveRect(currX, currY, tunnelThick, stepV + tunnelThick);
        currY += stepV;

        if (random() < 0.15) direction *= -1;
    }

    // Змеевидный спуск (Snake Descent)
    const snakeLevels = 4 + Math.floor(random() * 3);  
    for (let i = 0; i < snakeLevels; i++) {
        const hLen = BLOCK_SIZE * (10 + random() * 8);
        const vTotalLen = BLOCK_SIZE * (6 + random() * 4);
        const targetX = currX + (hLen * direction);
        
        carver.carveRect(Math.min(currX, targetX), currY, Math.abs(targetX - currX) + tunnelThick, tunnelThick);
        currX = targetX;

        if (random() > 0.2) {  
            let remainingV = vTotalLen;
            while (remainingV > 0) {
                carver.carveRect(currX, currY, tunnelThick, BLOCK_SIZE + tunnelThick);
                currY += BLOCK_SIZE;
                remainingV -= BLOCK_SIZE;
                
                const nextX = currX + (BLOCK_SIZE * 2) * direction;
                carver.carveRect(Math.min(currX, nextX), currY, (BLOCK_SIZE * 2) + tunnelThick, tunnelThick);
                currX = nextX;
            }
        } else {
            carver.carveRect(currX, currY, tunnelThick, vTotalLen + tunnelThick);
            currY += vTotalLen;
        }
        direction *= -1;
    }

    return { x: currX, y: currY };
}

export function buildMaze(carver, mazeStartX, mazeStartY, random) {
    const GRID_W = 12; 
    const GRID_H = 8;  
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
        if (!adj.get(k1).some(p => p.x === p2.x && p.y === p2.y)) {
            adj.get(k1).push(p2);
            adj.get(k2).push(p1);
        }
    };

    const getNeighbors = (x, y) => {
        const n = [];
        const dirs = [
            {x: -1, y: 0, weight: 4}, {x: 1, y: 0, weight: 4},
            {x: 0, y: 1, weight: 3}, {x: 0, y: -1, weight: 1}
        ];
        for (let d of dirs) {
            const nx = x + d.x, ny = y + d.y;
            if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H && !grid[ny][nx]) {
                for(let i = 0; i < d.weight; i++) n.push({x: nx, y: ny});
            }
        }
        return n;
    };

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

    for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W - 1; x++) {
            if (grid[y][x] && grid[y][x+1] && random() < 0.3) {
                addEdge({x, y}, {x: x + 1, y});
            }
        }
    }

    const gridOriginX = mazeStartX - (gx * CELL_PIXEL_SIZE); 
    const gridOriginY = mazeStartY;
    const drawnEdges = new Set(); 

    for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
            const k = `${x},${y}`;
            if (!grid[y][x]) continue;

            const cx = gridOriginX + x * CELL_PIXEL_SIZE;
            const cy = gridOriginY + y * CELL_PIXEL_SIZE;
            
            if (x === bottomNode.x && y === bottomNode.y) {
                console.log(`[Dungeon] 👑 Генерация Тронного Зала на X: ${cx}, Y: ${cy}`);
// Внутри блока Тронного Зала:
const roomW = BLOCK_SIZE * 35; 
const roomH = BLOCK_SIZE * 20;
carver.carveRect(cx - roomW/2, cy - roomH/2, roomW, roomH);

// --- КОЛОННЫ (зажигаются голубым) ---
const pillarOffset = BLOCK_SIZE * 4;
const pillars = [
    { x: cx - roomW/2 + pillarOffset, y: cy + roomH/2 - BLOCK_SIZE * 6 }, // Слева
    { x: cx + roomW/2 - pillarOffset - BLOCK_SIZE * 2, y: cy + roomH/2 - BLOCK_SIZE * 6 } // Справа
];

pillars.forEach(p => {
    carver.addRect({ 
        type: "boss_pillar", 
        x: p.x, y: p.y, w: BLOCK_SIZE * 2, h: BLOCK_SIZE * 6,
        roomCx: cx, roomCy: cy, roomW: roomW, roomH: roomH
    });
});

// --- ФАКЕЛЫ (зажигаются по очереди) ---
const numTorches = 8;
const torchSpacing = (roomW - BLOCK_SIZE * 10) / (numTorches - 1);
for(let i = 0; i < numTorches; i++) {
    carver.addRect({
        type: "boss_torch",
        x: (cx - roomW/2 + BLOCK_SIZE * 5) + (i * torchSpacing),
        y: cy - roomH/2 + BLOCK_SIZE * 2,
        w: BLOCK_SIZE, h: BLOCK_SIZE,
        delay: i * 300, // Эпичная очередь: каждый следующий через 0.3 сек
        roomCx: cx, roomCy: cy, roomW: roomW, roomH: roomH
    });
}

                carver.addRect({ type: "blue_block", x: cx - BLOCK_SIZE, y: cy - BLOCK_SIZE, w: BLOCK_SIZE*2, h: BLOCK_SIZE*2 });
                
if (!GameState.bossesDefeated['skeleton_boss']) {
    // Вместо спавна сущности ставим невидимый блок-триггер
    carver.addRect({ 
        type: "boss_spawn_trigger", 
        x: cx - BLOCK_SIZE, 
        y: cy - BLOCK_SIZE, 
        w: BLOCK_SIZE * 2, 
        h: BLOCK_SIZE * 2 
    });
    console.log("[Dungeon] 📍 Метка спавна босса установлена на X:", cx);
}

                for(let i = 0; i < 3; i++) {
                    mobManager.spawnDungeonMob(cx + (i * 100) - 100, cy + 100);
                    mobManager.spawnDungeonMob(cx + (i * 60) - 60, cy);
                }
            } else {
                const roomW = BLOCK_SIZE * (10 + Math.floor(random() * 8));
                const roomH = BLOCK_SIZE * (6 + Math.floor(random() * 4));
                carver.carveRect(cx - roomW/2, cy - roomH/2, roomW, roomH);

                if (random() < 0.4) {
                    mobManager.spawnDungeonMob(cx, cy - 40); 
                }
            }

            const neighbors = adj.get(k) || [];
            for (const n of neighbors) {
                const edgeKey = [k, `${n.x},${n.y}`].sort().join('-');
                if (drawnEdges.has(edgeKey)) continue;
                drawnEdges.add(edgeKey);

                const ncx = gridOriginX + n.x * CELL_PIXEL_SIZE;
                const ncy = gridOriginY + n.y * CELL_PIXEL_SIZE;
                const thick = BLOCK_SIZE * 3;

                if (n.x !== x) {
                    carver.carveRect(Math.min(cx, ncx), cy - thick/2, Math.abs(ncx - cx) + thick, thick);
                } else {
                    carver.carveRect(cx - thick/2, Math.min(cy, ncy), thick, Math.abs(ncy - cy) + thick);
                }
            }
        }
    }

    carver.connectPoints(mazeStartX, mazeStartY, mazeStartX, mazeStartY, BLOCK_SIZE * 3);
}