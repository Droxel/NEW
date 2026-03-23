// src/entities/mobs/MobManager.js
import { world } from "../../world/World.js"; // В структуре World.js с большой буквы
import { CONFIG } from "../../data/config.js";
import { cameraX, cameraY, assets } from "../../core/Braw.js"; // Braw.js с большой буквы
import { time } from "../../core/Time.js"; 
import { SPAWN_CONFIG } from "../../data/spawnConfig.js"; 
import { JungleSkeleton } from "./JungleSkeleton.js";
import { GiantMob } from "./GiantMob.js";

export const mobManager = {
    mobs: [],
    particles: [], 
    drops: [], 
    spawnTimer: 0,
    maxMobs: 30, 

update(dt, player) {
        if (!player) return;

        // Расстояние, дальше которого моб считается "забытым" и удаляется (в пикселях)
        const despawnDistance = 1500;

        // 1. Обновляем каждого моба и проверяем взаимодействия
        for (let i = 0; i < this.mobs.length; i++) {
            const mob = this.mobs[i];

// --- ЗАЩИТА ОТ МОБНОГО АПОКАЛИПСИСА (DESPAWN) ---
const distToPlayerX = Math.abs(player.x - mob.x);

if (distToPlayerX > despawnDistance) {
    // Иммунитет для боссов!
    if (mob instanceof GiantMob) {
        continue; // Босса не удаляем, он ждет игрока
    }
    
    mob.markedForDeletion = true;
    continue; 
}
            // ------------------------------------------------

            mob.update(dt, player, this.mobs);
            
            if (player.hp > 0 && !mob.isDead) {
                const dx = (player.x + player.size / 2) - (mob.x + mob.width / 2);
                const dy = (player.y + player.size / 2) - (mob.y + mob.height / 2);
                
                // Проверка коллизии (квадрат расстояния < 40^2)
                if ((dx * dx + dy * dy) < 1600) {
                    const isJumpingOnTop = (player.y + player.size) < (mob.y + mob.height * 0.5) && player.velocityY > 0;
                    
                    if (isJumpingOnTop) {
                        mob.takeDamage(10);
                        player.velocityY = -12;
                    } else if (player.invulnerableTimer <= 0) {
                        player.hp -= 1;
                        player.invulnerableTimer = 60; 
                        player.velocityX = Math.sign(dx) * 10;
                    }
                }
            }
        }

        // 2. Очищаем список (удаляем убитых и тех, кто слишком далеко)
        this.mobs = this.mobs.filter(mob => !mob.markedForDeletion);
        
        // 3. Уменьшаем таймер неуязвимости игрока
        if (player.invulnerableTimer > 0) {
            player.invulnerableTimer--;
        }

        // 4. Обновляем остальное
        this.updateParticles();
        this.updateDropsLogic(dt, player, player.inventory); 
        this.handleSpawning(player);
    },
spawnBossAtStart() {
    const spawnX = 1500; 
    let groundY = world.getHeight(spawnX);
    
    // Если чанк еще не прогрузился, кидаем его высоко в небо
    // Гравитация сама плавно опустит его на землю, когда игрок подойдет
    if (isNaN(groundY) || groundY === undefined) {
        groundY = -500; 
    }
    
    const boss = new GiantMob(spawnX, groundY - 250); 
    this.mobs.push(boss);
},
    updateParticles() {
        // Оптимизированный цикл для частиц (убираем forEach для производительности)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            p.vy += 0.2; // гравитация для частиц
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },
    spawnUraniumParticle(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 5 + 2,
                life: 1.0, 
                color: "#39FF14" 
            });
        }
    },

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
            // ЖЕЛЕЗОБЕТОННОЕ ПРАВИЛО: Мобы видят колонны деревни как стены
            if ((obj.type === "dungeon_wall" || obj.type === "dungeon_block" || obj.type === "village_wall") &&
                x >= obj.x && x <= obj.x + obj.width &&
                y >= obj.y && y <= obj.y + obj.height) {
                return true; 
            }
        }
        return false;
    },

handleSpawning(player) {
    this.spawnTimer++;
    
    // --- НАСТРОЙКИ ЧАСТОТЫ ---
    const spawnSpeed = 40; // Было 90. Чем меньше, тем чаще спавн.
    if (this.spawnTimer < spawnSpeed) return; 
    this.spawnTimer = 0;
    
    if (this.mobs.length >= this.maxMobs) return;

    // Выбираем сторону
    const mobsLeft = this.mobs.filter(m => m.x < player.x).length;
    const mobsRight = this.mobs.length - mobsLeft;
    const dir = mobsLeft > mobsRight ? 1 : -1;

    const spawnX = player.x + dir * (700 + Math.random() * 500); 
    let spawnY = player.y + (Math.random() * 400 - 200);

    // --- ТВОЯ ЗАЩИТА (АНТИ-АПОКАЛИПСИС) ---
    // Если хочешь "толпы", увеличь 2 до 5-7
    const maxDensity = 3; 
    const nearbyMobs = this.mobs.filter(m => Math.abs(m.x - spawnX) < 400).length;
    
    if (nearbyMobs >= maxDensity) {
        return; // Слишком тесно, не спавним
    }

    const inDungeon = this.isPointInDungeon(spawnX, spawnY);
    const biome = world.getBiome(spawnX);
    const currentPool = inDungeon ? SPAWN_CONFIG.dungeon : SPAWN_CONFIG.surface;

    if (!currentPool) return;

    currentPool.forEach(cfg => {
        // Увеличь cfg.chance в своем SPAWN_CONFIG, если хочешь еще больше мобов
        if (Math.random() < cfg.chance && cfg.check(time, biome)) {
            if (!inDungeon) {
                const groundY = world.getHeight(spawnX); 
                if (groundY < 5000) { 
                    const mobH = (cfg.params && cfg.params[0] === true) ? 40 : 30;
                    this.addMob(cfg.class, spawnX, groundY - mobH, cfg.params);
                }
            } else {
                if (!this.isPointInWall(spawnX, spawnY)) {
                    this.addMob(cfg.class, spawnX, spawnY, cfg.params);
                }
            }
        }
    });
},
// --- НОВЫЙ МЕТОД ДЛЯ ДАНЖЕЙ ---
    spawnDungeonMob(x, y) {
        // Используем класс JungleSkeleton, который у тебя уже импортирован в начале файла
        this.addMob(JungleSkeleton, x, y);
    },

    addMob(MobClass, x, y, params = []) {
        const newMob = new MobClass(x, y, ...params);
        this.mobs.push(newMob);
    },
    // Добавь это после метода addMob
spawnBossAtStart() {
    // Поменяй 0 на 1500 или 2000, чтобы он стоял вдали
    const spawnX = 1500; 
    
    // groundY сам посчитает высоту земли в этой точке
    const groundY = world.getHeight(spawnX);
    
    // Спавним его чуть выше земли, чтобы он красиво "приземлился"
    const boss = new GiantMob(spawnX, groundY - 250); 
    
    this.mobs.push(boss);
},

    spawnDrop(x, y) {
        this.drops.push({
            x: x, y: y,
            size: 20, 
            vx: (Math.random() - 0.5) * 10,
            vy: - (Math.random() * 8 + 4), 
            onGround: false,
            pickedUp: false,
            createdAt: Date.now() 
        });
    },

    updateDropsLogic(dt, player, playerInventory) {
        const currentTime = Date.now();
        this.drops.forEach(drop => {
            drop.vy += CONFIG.gravity;
            drop.x += drop.vx;
            drop.y += drop.vy;
            drop.vx *= 0.95; 

            let hitFloor = false;

            if (this.isPointInDungeon(drop.x, drop.y)) {
                if (this.isPointInWall(drop.x + drop.size / 2, drop.y + drop.size)) {
                    hitFloor = true;
                    drop.y -= drop.vy;
                }
            } else {
                const groundY = world.getHeight(drop.x); 
                if (drop.y + drop.size >= groundY) {
                    hitFloor = true;
                    drop.y = groundY - drop.size;
                }
            }

            if (hitFloor) {
                drop.vy = -drop.vy * 0.5; 
                drop.vx *= 0.8; 
                if (Math.abs(drop.vy) < 1) drop.vy = 0;
            }
            
            const dx = (player.x + player.size/2) - (drop.x + drop.size/2);
            const dy = (player.y + player.size/2) - (drop.y + drop.size/2);
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (currentTime - drop.createdAt < 700) return; 

            if (dist < 150) { 
                drop.x += (dx / dist) * 8;
                drop.y += (dy / dist) * 8;
            }

            if (dist < 30) {
                if (playerInventory) {
                    const success = playerInventory.addCrystal(1);
                    if (success) drop.pickedUp = true;
                }
            }
        });
        
        this.drops = this.drops.filter(d => !d.pickedUp);
    },

draw(ctx) {
    // Определяем границы видимости камеры
    const leftView = cameraX - 100;
    const rightView = cameraX + CONFIG.width + 100;

    // Рисуем только тех мобов, которые в кадре
    for (let i = 0; i < this.mobs.length; i++) {
        const m = this.mobs[i];
        if (m.x + m.width > leftView && m.x < rightView) {
            m.draw(ctx);
        }
    }

    // Рисуем лут (кристаллы) только в кадре
    const now = Date.now();
    for (let i = 0; i < this.drops.length; i++) {
        const d = this.drops[i];
        if (d.x + d.size > leftView && d.x < rightView) {
            const hover = Math.sin(now / 200) * 3;
            if (assets.crystal?.complete) {
                ctx.drawImage(assets.crystal, d.x, d.y + hover, d.size, d.size);
            }
        }
    }

    // Частицы
    for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        if (p.x > leftView && p.x < rightView) {
            ctx.fillStyle = p.color || "#39FF14"; 
            ctx.globalAlpha = p.life; 
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
    }
    ctx.globalAlpha = 1.0;
}
};