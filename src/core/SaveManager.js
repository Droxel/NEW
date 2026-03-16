// src/core/SaveManager.js

const SAVE_KEY = 'my_game_saves';

export class SaveManager {
    // Получить все миры
    static getWorlds() {
        const data = localStorage.getItem(SAVE_KEY);
        return data ? JSON.parse(data) : {};
    }

    // Сохранить или обновить мир
    static saveWorld(worldData) {
        const worlds = this.getWorlds();
        // Если ID нет, генерируем уникальный
        if (!worldData.id) {
            worldData.id = 'world_' + Date.now();
        }
        worldData.lastPlayed = Date.now();
        worlds[worldData.id] = worldData;
        
        localStorage.setItem(SAVE_KEY, JSON.stringify(worlds));
        return worldData;
    }

    // Удалить мир
    static deleteWorld(worldId) {
        const worlds = this.getWorlds();
        delete worlds[worldId];
        localStorage.setItem(SAVE_KEY, JSON.stringify(worlds));
    }

    // Запомнить, в какой мир мы сейчас играем
    static setCurrentWorldId(worldId) {
        localStorage.setItem('current_world_id', worldId);
    }

    static getCurrentWorldId() {
        return localStorage.getItem('current_world_id');
    }
static getSettings() {
    const data = localStorage.getItem('game_settings');
    return data ? JSON.parse(data) : { resolution: 1.0 }; // По умолчанию 1.0 (Обычное)
}

static saveSettings(settings) {
    localStorage.setItem('game_settings', JSON.stringify(settings));
}
}