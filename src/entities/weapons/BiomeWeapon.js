/* src/entities/weapons/BiomeWeapon.js */
import { player } from "../player/Player.js";
import { ForestWeapon } from "./ForestWeapon.js"; 
import { DesertWeapon } from "./DesertWeapon.js";
// В будущем добавишь сюда импорты:
// import { DesertWeapon } from "./DesertWeapon.js";

export class BiomeWeaponManager {
    constructor() {
        this.currentWeapon = null;
        this.activeId = null;
    }

    update() {
        // Смотрим в 3-ю ячейку пузыря (индекс 2)
        const weaponItem = player.inventory.bubbleSlots[2];

        if (!weaponItem) {
            this.currentWeapon = null;
            this.activeId = null;
            return;
        }

        // Если предмет изменился — создаем новый экземпляр логики
        if (this.activeId !== weaponItem.id) {
            this.activeId = weaponItem.id;
            this.initWeaponLogic(weaponItem.id);
        }

        if (this.currentWeapon) {
            this.currentWeapon.update(weaponItem);
        }
    }

initWeaponLogic(id) {
    // Проверяем ID, которые приходят из конфига BIOME_WEAPONS
    if (id === 'wooden_mallet' || id === 'wpn_forest') {
        this.currentWeapon = new ForestWeapon(player);
    } 
    // Исправлено: заменяем 'desert_knife' на 'wpn_desert'
    else if (id === 'wpn_desert' || id === 'desert_knife') { 
        this.currentWeapon = new DesertWeapon(player); 
        console.log("🌵 Клинок пустыни инициализирован!");
    }
}

    // Добавил передачу assets, чтобы оружие могло себя нарисовать
    draw(ctx, assets) { 
        const weaponItem = player.inventory.bubbleSlots[2];
        
        if (this.currentWeapon) {
            this.currentWeapon.draw(ctx, assets, weaponItem); 
        }
    }
}

export const biomeWeaponManager = new BiomeWeaponManager();