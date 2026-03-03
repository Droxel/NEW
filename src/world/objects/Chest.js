//Chest.js
/* Chest.js */
import { hash, WORLD_SEED } from "../seed.js";
import { generateChestLoot } from "../../core/lootConfig.js";

export class Chest {
    // Добавили chestIndex в конструктор
    constructor(x, y, chestIndex) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 35;
        this.isOpen = false;
        
        // Передаем chestIndex в функцию генерации
        this.slots = generateChestLoot(chestIndex);
    }

    interact() {
        if (!this.isOpen) {
            this.isOpen = true;
            if (window.openChestUI) {
                window.openChestUI(this);
            }
        } else {
            if (window.closeChestUI) {
                window.closeChestUI();
            }
            this.isOpen = false;
        }
    }
    getImageKey() {
        return this.isOpen ? "chestopen" : "chestunopened";
    }
}