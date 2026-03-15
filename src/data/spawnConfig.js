/* src/data/spawnConfig.js */
import { CubeSlime } from "../entities/mobs/SlimeMob.js"; // Проверь имя экспорта (CubeSlime или SlimeMob)
import { JungleSkeleton } from "../entities/mobs/JungleSkeleton.js";

export const SPAWN_CONFIG = {
    surface: [
        {
            class: CubeSlime,
            name: "gray_slime",
            chance: 0.8,
            // Серые спавнятся всегда (и днем, и ночью)
            check: (time) => true, 
            params: [false] // isNightMob = false (серый)
        },
        {
            class: CubeSlime,
            name: "green_slime",
            chance: 0.6,
            // Зеленые только ночью (фактор 1 = ночь)
            check: (time) => time.getNightFactor() === 1, 
            params: [true] // isNightMob = true (зеленый)
        }
    ],
    dungeon: [
        {
            class: JungleSkeleton,
            name: "jungle_skeleton",
            chance: 0.9,
            // В данже всегда, убираем строгую проверку биома, если мы уже в данже
            check: (time) => true, 
            params: []
        }
    ]
};