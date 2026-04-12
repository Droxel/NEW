/*// src/entities/mobs/MobSpawner.js
import { world } from "../../world/World.js";
import { time } from "../../core/Time.js"; 
import { SPAWN_CONFIG } from "../../data/spawnConfig.js"; 
import { JungleSkeleton } from "./JungleSkeleton.js";
import { GiantMob } from "./GiantMob.js";
import { GameState } from "../../core/GameState.js";
import { bossManager } from "../bosses/BossManager.js";*/

export const mobSpawner = {
    spawnTimer: 0,
    lastSpawnX: 0,

    isPointInDungeon(x, y) {
        if (!world.chunkManager) return false;
        const chunkId = world.chunkManager.getChunkId(x);
        const chunk = world.chunkManager.chunks.get(chunkId);
        if (!chunk || !chunk.objects) return false;

        return chunk.objects.some(obj => 
            (obj.type === "dungeon_bg" || obj.type === "dungeon_bg_smooth" || obj.type === "dungeon_wall") &&
            x >= obj.x && x <= obj.x + obj.width &&
            y >= obj.y && y <= obj.y + obj.height
        );
    },

    isPointInWall(x, y) {
        if (!world.chunkManager) return false;
        const chunkId = world.chunkManager.getChunkId(x);
        const chunk = world.chunkManager.chunks.get(chunkId);
        if (!chunk || !chunk.objects) return false;

        const objs = chunk.objects;
        for (let i = 0; i < objs.length; i++) {
            const obj = objs[i];
            if ((obj.type === "dungeon_wall" || obj.type === "dungeon_block" || obj.type === "village_wall") &&
                x >= obj.x && x <= obj.x + obj.width &&
                y >= obj.y && y <= obj.y + obj.height) {
                return true; 
            }
        }
        return false;
    },

    handleSpawning(player, mobManager) {
        this.spawnTimer++;

        const distanceMoved = Math.abs(player.x - this.lastSpawnX);
        const isStanding = Math.abs(player.velocityX || 0) < 0.1;
        
        if (isStanding && distanceMoved < 400) return;

        const currentSpawnRate = isStanding ? 300 : 60; 
        if (this.spawnTimer < currentSpawnRate) return; 

        const nearbyMobs = mobManager.mobs.filter(m => {
            const dist = Math.abs(m.x - player.x);
            return dist < 1200 && !(m instanceof GiantMob);
        }).length;

        const localLimit = isStanding ? 4 : 8; 
        if (nearbyMobs >= localLimit) return;

        if (mobManager.mobs.length >= mobManager.maxMobs) return;

        const mobsLeft = mobManager.mobs.filter(m => m.x < player.x).length;
        const mobsRight = mobManager.mobs.length - mobsLeft;
        const dir = mobsLeft > mobsRight ? 1 : -1;

        const spawnX = player.x + dir * (900 + Math.random() * 500); 
        let spawnY = player.y + (Math.random() * 400 - 200);

        if (GameState.bossesDefeated['jungle_boss'] && !bossManager.boss) { 
            const spawnChance = 0.05; 
            const giantExists = mobManager.mobs.some(m => m instanceof GiantMob);

            if (Math.random() < spawnChance && !giantExists) {
                const groundY = world.getHeight(spawnX);
                if (!isNaN(groundY)) {
                    console.log("⚠️ Вдалеке показался гигант...");
                    mobManager.addMob(GiantMob, spawnX, groundY - 300);
                    return; 
                }
            }
        }

        this.lastSpawnX = player.x;
        this.spawnTimer = 0;

        const inDungeon = this.isPointInDungeon(spawnX, spawnY);
        const biome = world.getBiome(spawnX);
        const currentPool = inDungeon ? SPAWN_CONFIG.dungeon : SPAWN_CONFIG.surface;

        if (!currentPool) return;

        currentPool.forEach(cfg => {
            if (Math.random() < cfg.chance && cfg.check(time, biome)) {
                if (!inDungeon) {
                    const groundY = world.getHeight(spawnX); 
                    if (groundY < 5000) { 
                        const mobH = (cfg.params && cfg.params[0] === true) ? 40 : 30;
                        mobManager.addMob(cfg.class, spawnX, groundY - mobH, cfg.params);
                    }
                } else {
                    if (!this.isPointInWall(spawnX, spawnY)) {
                        mobManager.addMob(cfg.class, spawnX, spawnY, cfg.params);
                    }
                }
            }
        });
    },

    spawnBossAtStart(mobManager) {
        const spawnX = 1500; 
        let groundY = world.getHeight(spawnX);
        if (isNaN(groundY) || groundY === undefined) {
            groundY = -500; 
        }
        const boss = new GiantMob(spawnX, groundY - 250); 
        mobManager.mobs.push(boss);
    },

    spawnDungeonMob(x, y, mobManager) {
        mobManager.addMob(JungleSkeleton, x, y);
    }
};