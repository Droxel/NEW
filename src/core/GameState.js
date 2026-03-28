// src/core/GameState.js
export const GameState = {
    // Какие боссы побеждены
    bossesDefeated: {
        'cube_boss': false,   // 1 босс (Лес)
        'desert_boss': false, // 2 босс (Пустыня)
        'jungle_boss': false  // 3 босс (Джунгли)
    },
    
    // Текущий уровень зла (от 0 до 3)
    get corruptionLevel() {
        let level = 0;
        if (this.bossesDefeated['cube_boss']) level++;
        if (this.bossesDefeated['desert_boss']) level++;
        if (this.bossesDefeated['jungle_boss']) level++;
        return level;
    }
};