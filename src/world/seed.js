// src/world/seed.js
export let WORLD_SEED = 123456789; // Теперь это let

export function setWorldSeed(newSeed) {
    WORLD_SEED = newSeed;
}

export function hash(n) {
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n ^= n >>> 15;
    return (n >>> 0) / 4294967296;
}

export function smoothNoise(x, scale = 1, seed = 0) {
    const i = Math.floor(x * scale);
    const f = x * scale - i;
    const a = hash(i + seed);
    const b = hash(i + 1 + seed);
    const t = f * f * (3 - 2 * f);
    return a * (1 - t) + b * t;
}

export function fbm(x, options = {}) {
    const {
        octaves = 4,
        persistence = 0.5,
        lacunarity = 2,
        scale = 0.001,
        seed = 0
    } = options;

    let value = 0;
    let amp = 1;
    let freq = scale;
    let max = 0;

    for (let i = 0; i < octaves; i++) {
        value += smoothNoise(x, freq, seed + i * 999) * amp;
        max += amp;
        amp *= persistence;
        freq *= lacunarity;
    }

    return (value / max) * 2 - 1;
}

// --- НОВАЯ ФУНКЦИЯ: ЕДИНАЯ ЛОГИКА ОЗЕР ---
// Возвращает число от 0 до 1.
// 0 - нет озера.
// 1 - самый центр глубокого озера.
export function getLakeIntensity(x) {
    const BASIN_THRESHOLD = 0.55;

    let v = fbm(x, {
        scale: 0.00115,
        octaves: 3,
        seed: WORLD_SEED + 5555
    });
    
    // Нормализуем v от 0 до 1
    const normalized = (v + 1) / 2;
    const inverted = 1 - normalized;

    if (inverted > BASIN_THRESHOLD) {
        // Вычисляем силу озера (кривую)
        const t = (inverted - BASIN_THRESHOLD) / (1 - BASIN_THRESHOLD);
        return Math.pow(t, 2); // Парабола для плавного дна
    }
    
    return 0; // Нет озера
}