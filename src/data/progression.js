// src/data/progression.js

export const progression = {
    // Основные этапы игры
    isGiantEra: true,        // Появляются ли гиганты в мире?
    isHardmode: false,        // Аналог хардмода из Террарии
    
    // Побежденные боссы
    bossesDefeated: {
        giant: false,
        jungle: false,
        desert: false
    },

    // Метод для включения эры гигантов (вызывай его, когда нужно усложнить игру)
    unlockGiants() {
        this.isGiantEra = true;
        console.log("Эра Гигантов началась! Теперь они бродят по поверхности.");
    }
};