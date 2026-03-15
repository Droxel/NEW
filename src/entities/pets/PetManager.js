//PetManager.js
import { world } from "../../world/World.js";
import { GhostPet } from "./GhostPet.js";
import { PetEquipment } from "./PetEquipment.js";
export const petManager = {
    wildPets: [],
    activePet: null,
    spawnTimer: 0,

update(dt, player, mobs, droppedItems) {
    this.handleSpawning(player);

    // 1. Обновление диких призраков
    this.wildPets.forEach(pet => {
        pet.update(dt, player, mobs, droppedItems);
        
        // Если призрака кто-то начал приручать, делаем его активным
        if (pet.isTamed) {
            this.activePet = pet;
            this.wildPets = this.wildPets.filter(p => p !== pet);
        }
    });

    // 2. Обновление активного питомца
    if (this.activePet) {
        PetEquipment.update(this); 
        this.activePet.update(dt, player, mobs, droppedItems);
        
        if (this.activePet.hp <= 0) this.activePet = null;
    }
},
handleSpawning(player) {
    // Если уже есть прирученный или дикий рядом — не спавним второго
    if (this.activePet || this.wildPets.length > 0) return;

    this.spawnTimer++;
    
    // Сделаем проверку каждую секунду (60 кадров)
    if (this.spawnTimer < 60) return; 
    this.spawnTimer = 0;

    const currentBiome = world.getBiome(player.x);
    
    // ЛОГ ДЛЯ ТЕБЯ: чтобы ты видел, в каком ты биоме сейчас
    console.log(`%c[DEBUG] Текущий биом: ${currentBiome}`, "color: #aaa");

    // ВРЕМЕННО: убираем проверку на биом и ставим шанс 100%
    // Когда наиграешься, верни: if (currentBiome === "plains")
    if (true) { 
        const dir = Math.random() > 0.5 ? 1 : -1;
        // Спавним поближе (300 пикселей), чтобы сразу увидеть
        const spawnX = player.x + dir * 300; 
        const spawnY = player.y - 100; // Немного над головой

        const newGhost = new GhostPet(spawnX, spawnY);
        this.wildPets.push(newGhost);

        console.group("%c👻 ПРИЗРАК ЗАПАВНИЛСЯ (100% ШАНС)!", "color: #8800ff; font-weight: bold;");
        console.log(`Координаты: X: ${Math.round(spawnX)}, Y: ${Math.round(spawnY)}`);
        console.groupEnd();
    }
},

    draw(ctx) {
        this.wildPets.forEach(pet => pet.draw(ctx));
        if (this.activePet) this.activePet.draw(ctx);
    }
};