// src/entities/animals/AnimalManager.js
import { world } from "../../world/World.js";
import { Fennec } from "./Fennec.js";

export const animalManager = {
    animals: [],
    maxAnimals: 10, 
    spawnTimer: 0,
    spawnRate: 80, // Раз в 80 тиков проверяем спавн

    update(dt, player) {
        if (!player) return;

        const despawnDistance = 1600;

        for (let i = 0; i < this.animals.length; i++) {
            const animal = this.animals[i];

            if (Math.abs(player.x - animal.x) > despawnDistance) {
                animal.markedForDeletion = true;
                continue;
            }

            animal.update(dt, player, this.animals);
        }

        this.animals = this.animals.filter(a => !a.markedForDeletion);

        this.handleSpawning(player);
    },

    handleSpawning(player) {
        this.spawnTimer++;
        if (this.spawnTimer < this.spawnRate) return;
        this.spawnTimer = 0;

        if (this.animals.length >= this.maxAnimals) return;

        const leftCount = this.animals.filter(a => a.x < player.x).length;
        const rightCount = this.animals.length - leftCount;
        const dir = leftCount > rightCount ? 1 : -1;

        const spawnX = player.x + dir * (850 + Math.random() * 400);
        const biome = world.getBiome ? world.getBiome(spawnX) : "desert"; 

        if (biome === "desert") {
            // ШАНС 100% ДЛЯ ТЕСТИРОВАНИЯ
            const spawnChance = 1.0; 
            
            if (Math.random() < spawnChance) {
                const groundY = world.getHeight(spawnX);
                if (!isNaN(groundY) && groundY < 5000) {
                    const fennec = new Fennec(spawnX, groundY - 24);
                    this.animals.push(fennec);
                    console.log(`%c🐾 [AnimalManager] В пустыне успешно заспавнен фенек на X: ${Math.floor(spawnX)}!`, "color: #00ff66; font-weight: bold;");
                }
            }
        }
    },

    draw(ctx) {
        for (let animal of this.animals) {
            animal.draw(ctx);
        }
    },

    clearAll() {
        this.animals = [];
    }
};