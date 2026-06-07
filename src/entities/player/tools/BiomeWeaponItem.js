// src/entities/player/tools/BiomeWeaponItem.js
export class BiomeWeapon {
    constructor(id, name, icon, biomeType) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.type = 'biome_weapon'; 
        this.biome = biomeType;     
        this.count = 1;
        this.description = `Уникальное оружие биома: ${biomeType}`;
        this.isFloating = false;    
    }
}
