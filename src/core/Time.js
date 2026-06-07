/* src/core/Time.js */
import { CONFIG } from "../data/config.js";

export const time = {
    elapsed: 0,

    update(dt) {
        this.elapsed += dt;
    },

    getNormalized() {
        const cycle = CONFIG.SKY?.cycleDuration || 900;
        return (this.elapsed % cycle) / cycle;
    },

    // Метод для спавна мобов (0 - день, 1 - ночь)
    getNightFactor() {
        const norm = this.getNormalized();
        
        // Раньше было 0.5. 
        // Теперь день длится 8 минут из 15. 8 / 15 = 0.533
        // То есть до 0.533 у нас день, после — ночь.
        const dayLimit = 8 / 15; 
        
        return norm > dayLimit ? 1 : 0;
    }
};