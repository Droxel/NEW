/* src/entities/weapons/BiomeWeapon.js */
import { player } from "../player/Player.js";
import { ForestWeapon } from "./ForestWeapon.js"; 
import { DesertWeapon } from "./DesertWeapon.js";
import { JungleWeapon } from "./JungleWeapon.js";

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
    if (id === 'wooden_mallet' || id === 'wpn_forest') {
        this.currentWeapon = new ForestWeapon(player);
    } 
    else if (id === 'wpn_desert' || id === 'desert_knife') { 
        this.currentWeapon = new DesertWeapon(player); 
        console.log("🌵 Клинок пустыни инициализирован!");
    }
    // <-- ДОБАВИТЬ ЭТОТ БЛОК
    else if (id === 'wpn_jungle' || id === 'fang_jungles') {
        this.currentWeapon = new JungleWeapon(player);
        console.log("🌴 Отравленный клык инициализирован!");
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