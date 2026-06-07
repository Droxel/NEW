export const BLOCK_SIZE = 40;

export class DungeonCarver {
    constructor(startX, startY) {
        this.startX = startX;
        this.startY = startY;
        this.rects = [];
        this.carvedTiles = new Set();
    }

    carve(x, y) {
        const gx = Math.floor(x / BLOCK_SIZE) * BLOCK_SIZE;
        const gy = Math.floor(y / BLOCK_SIZE) * BLOCK_SIZE;
        this.carvedTiles.add(`${gx},${gy}`);
    }

    carveRect(x, y, w, h) {
        for (let iy = 0; iy < h; iy += BLOCK_SIZE) {
            for (let ix = 0; ix < w; ix += BLOCK_SIZE) {
                this.carve(x + ix, y + iy);
            }
        }
    }

    connectPoints(x1, y1, x2, y2, thickness) {
        x1 = Math.floor(x1 / BLOCK_SIZE) * BLOCK_SIZE;
        y1 = Math.floor(y1 / BLOCK_SIZE) * BLOCK_SIZE;
        x2 = Math.floor(x2 / BLOCK_SIZE) * BLOCK_SIZE;
        y2 = Math.floor(y2 / BLOCK_SIZE) * BLOCK_SIZE;

        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        this.carveRect(minX, y1, (maxX - minX) + thickness, thickness);
        this.carveRect(x2, minY, thickness, (maxY - minY) + thickness);
    }

    addRect(rectData) {
        this.rects.push(rectData);
    }

    // --- PHASE 5: BG OPTIMIZATION (Greedy Meshing) ---
    optimizeBackgrounds() {
        const finalTiles = [];
        this.carvedTiles.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            finalTiles.push({x, y});
        });
        
        finalTiles.sort((a, b) => (a.y - b.y) || (a.x - b.x));

        if (finalTiles.length > 0) {
            let currentRect = { ...finalTiles[0], w: BLOCK_SIZE };
            for (let i = 1; i < finalTiles.length; i++) {
                const tile = finalTiles[i];
                if (tile.y === currentRect.y && tile.x === currentRect.x + currentRect.w) {
                    currentRect.w += BLOCK_SIZE; 
                } else {
                    const bgType = (currentRect.y < this.startY) ? "dungeon_bg_smooth" : "dungeon_bg";
                    this.addRect({ type: bgType, x: currentRect.x, y: currentRect.y, w: currentRect.w, h: BLOCK_SIZE });
                    currentRect = { x: tile.x, y: tile.y, w: BLOCK_SIZE };
                }
            }
            const bgType = (currentRect.y < this.startY) ? "dungeon_bg_smooth" : "dungeon_bg";
            this.addRect({ type: bgType, x: currentRect.x, y: currentRect.y, w: currentRect.w, h: BLOCK_SIZE });
        }
    }

    // --- PHASE 6: WALL GENERATION ---
    generateWalls() {
        const wallSet = new Set();
        this.carvedTiles.forEach(tileKey => {
            const [tx, ty] = tileKey.split(',').map(Number);
            const neighbors = [
                {dx: -BLOCK_SIZE, dy: 0}, {dx: BLOCK_SIZE, dy: 0},
                {dx: 0, dy: -BLOCK_SIZE}, {dx: 0, dy: BLOCK_SIZE}
            ];

            neighbors.forEach(n => {
                const nx = tx + n.dx;
                const ny = ty + n.dy;
                const nKey = `${nx},${ny}`;

                if (!this.carvedTiles.has(nKey) && !this.rects.some(r => r.x === nx && r.y === ny && r.type.includes("wall"))) {
                    wallSet.add(nKey);
                }
            });
        });

        wallSet.forEach(key => {
            const [wx, wy] = key.split(',').map(Number);
            const type = (wy < this.startY) ? "dungeon_wall_smooth" : "dungeon_wall";
            this.addRect({ type: type, x: wx, y: wy, w: BLOCK_SIZE, h: BLOCK_SIZE });
        });
    }
}

export function createRandom(seed) {
    return function() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
}