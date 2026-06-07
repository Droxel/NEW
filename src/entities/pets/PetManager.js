// src/entities/pets/PetManager.js
import { world } from "../../world/World.js";
import { GhostPet } from "./GhostPet.js";
import { PetEquipment } from "./PetEquipment.js";
import { RockPet } from "./RockPet.js";

export const petManager = {
    wildPets: [],
    activePet: null, // Это место строго для призрака
    rockPet: null,   // А это персональное место для камня-милашки!
    spawnTimer: 0,
    rockTamed: false,

    update(dt, player, mobs, droppedItems) {
        this.handleSpawning(player);
        this.handleRockTaming(droppedItems);

        // 1. Обновление диких призраков
        this.wildPets.forEach(pet => {
            pet.update(dt, player, mobs, droppedItems);
            
            // Если призрака кто-то начал приручать, делаем его активным
            if (pet.isTamed) {
                this.activePet = pet;
                this.wildPets = this.wildPets.filter(p => p !== pet);
            }
        });

        // 2. Обновление активного призрака
        if (this.activePet) {
            PetEquipment.update(this); 
            this.activePet.update(dt, player, mobs, droppedItems);
            
            if (this.activePet.hp <= 0) this.activePet = null;
        }

// 3. Обновление нашего камня-питомца
        if (this.rockPet) {
            // Передаем droppedItems, чтобы он мог их "видеть" и кушать
            this.rockPet.update(dt, player, droppedItems);
        }
    },

    handleSpawning(player) {
        // Если уже есть прирученный призрак или дикий рядом — не спавним второго
        if (this.activePet || this.wildPets.length > 0) return;

        this.spawnTimer++;
        if (this.spawnTimer < 60) return; 
        this.spawnTimer = 0;

        const currentBiome = world.getBiome(player.x);
        console.log(`%c[DEBUG] Текущий биом: ${currentBiome}`, "color: #aaa");

        if (true) { 
            const dir = Math.random() > 0.5 ? 1 : -1;
            const spawnX = player.x + dir * 300; 
            const spawnY = player.y - 100; 

            const newGhost = new GhostPet(spawnX, spawnY);
            this.wildPets.push(newGhost);

            console.group("%c👻 ПРИЗРАК ЗАПАВНИЛСЯ (100% ШАНС)!", "color: #8800ff; font-weight: bold;");
            console.log(`Координаты: X: ${Math.round(spawnX)}, Y: ${Math.round(spawnY)}`);
            console.groupEnd();
        }
    },

handleRockTaming(droppedItems) {
        if (this.rockTamed || this.rockPet) return;
        if (!droppedItems || droppedItems.length === 0) return;

        let tamed = false;

        droppedItems.forEach(drop => {
            // 🐛 ИСПРАВЛЕНИЕ 1: Ищем ID внутри itemData (с опциональной цепочкой ?.)
            const itemId = drop.itemData?.id || drop.id || drop.item?.id;
            
            // 🐛 ИСПРАВЛЕНИЕ 2: Проверяем правильный флаг pickedUp (без is)
            if (tamed || itemId !== 'stone' || drop.pickedUp) return;

            // Ищем чанки вокруг, чтобы проверить декор-камни
            if (world.chunkManager) {
                for (const [id, chunk] of world.chunkManager.chunks.entries()) {
                    for (let i = 0; i < chunk.objects.length; i++) {
                        const obj = chunk.objects[i];
                        
                        if (obj.type === 'decor_rock') {
                            // Проверяем расстояние от выброшенного камня до камня-декора
                            const dist = Math.hypot(drop.x - obj.x, drop.y - obj.y);
                            if (dist < 80) { 
                                
                                // ✨ МАГИЯ ОЖИВЛЕНИЯ ✨
                                this.rockTamed = true; 
                                
                                // 🐛 ИСПРАВЛЕНИЕ 3: Ставим правильный флаг, чтобы предмет исчез с земли
                                drop.pickedUp = true; 
                                
                                chunk.objects.splice(i, 1); 
                                
                                // Создаем милашку!
                                this.rockPet = new RockPet(obj.x, obj.y, {
    points: obj.points,
    rotation: obj.rotation,
    scale: obj.scale
});
                                console.log("🪨 Камешек открыл глазки и ожил!");
                                break;
                            }
                        }
                    }
                    if (tamed) break; 
                }
            }
        });
    },

    // Обязательно прокидываем camera, иначе у камня поедут координаты глаз!
    draw(ctx, camera) {
        this.wildPets.forEach(pet => pet.draw(ctx, camera));
        if (this.activePet) this.activePet.draw(ctx, camera);
        if (this.rockPet) this.rockPet.draw(ctx, camera);
    }
};