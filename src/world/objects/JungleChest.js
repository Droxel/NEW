/* JungleChest.js */
import { generateChestLoot } from "../../core/lootConfig.js";

export class JungleChest {
    constructor(x, y, chestIndex) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 35;
        this.type = "jungle";
        
        this.state = 0; 
// Мы добавили второй аргумент "jungle"
this.slots = generateChestLoot(chestIndex, "jungle"); 
    }

    interact() {
        if (this.state === 0) {
            this.state = 1; // Клик 1: Сняли замок
            console.log("Джунглевый сундук: Замок открыт");
        } else if (this.state === 1) {
            this.state = 2; // Клик 2: Открыли крышку
            if (window.openChestUI) {
                window.openChestUI(this);
            }
        } else {
            // Клик 3: Закрыли крышку
            if (window.closeChestUI) {
                window.closeChestUI();
            }
            this.state = 1; 
        }
    }

    getImageKey() {
        if (this.state === 0) return "jungle_chest_locked";
        if (this.state === 1) return "jungle_chest_closed";
        return "jungle_chest_open";
    }
}