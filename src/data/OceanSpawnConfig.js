//OceanSpawnConfig.js
export const OCEAN_SPAWN_CONFIG = {
    maxCreatures: 40, // Максимум существ вокруг игрока
    despawnDistance: 2500, // Дистанция, на которой рыбы пропадают
    spawnRadius: 1500, // На каком расстоянии от игрока они появляются
    
    // Шансы спавна (относительные)
    weights: {
        school: 60, // Стайка обычных рыб
        pufferfish: 20,
        jellyfish: 20
    },
    
    // Настройки стаи
    schoolSize: { min: 3, max: 7 }
};