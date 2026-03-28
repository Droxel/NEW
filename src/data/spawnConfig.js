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