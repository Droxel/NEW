// src/data/spawnConfig.js
import { CubeSlime } from "../entities/mobs/SlimeMob.js";
import { JungleSkeleton } from "../entities/mobs/JungleSkeleton.js";
import { GiantMob } from "../entities/mobs/GiantMob.js"; // Импортируем гиганта
import { progression } from "./progression.js"; // Импортируем прогрессию

export const SPAWN_CONFIG = {
    surface: [
        {
            class: CubeSlime,
            name: "gray_slime",
            chance: 0.8,
            check: (time, biome) => true, 
            params: [false]
        },
        {
            class: CubeSlime,
            name: "green_slime",
            chance: 0.6,
            check: (time, biome) => time.getNightFactor() === 1, 
            params: [true]
        },
        // --- ГИГАНТЫ ---
{
    class: GiantMob,
    name: "world_giant",
    chance: 0.05, // Гиганты — это событие, лучше сделать шанс поменьше
    check: (time, biome) => {
        const isNight = time.getNightFactor() > 0.5; // Может, пусть только ночью ходят?
        return progression.isGiantEra && biome !== 'village';
    },
    params: [] 
}
    ],
    dungeon: [
        {
            class: JungleSkeleton,
            name: "jungle_skeleton",
            chance: 0.9,
            check: (time, biome) => true, 
            params: []
        }
    ]
};