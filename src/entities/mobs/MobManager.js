// src/entities/mobs/MobManager.js
import { world } from "../../world/world.js";
import { CONFIG } from "../../core/config.js";
import { cameraX, cameraY, assets } from "../../core/braw.js";
import { time } from "../../core/time.js"; 
import { SPAWN_CONFIG } from "../../core/spawnConfig.js"; 
import { JungleSkeleton } from "./JungleSkeleton.js";

export const mobManager = {
    mobs: [],
    particles: [], 
    drops: [], 
    spawnTimer: 0,
    maxMobs: 60, 

    update(dt, player) {
        if (!player) return;

        // 1. Обновляем каждого моба и проверяем урон по игроку
        this.mobs.forEach(mob => {
            mob.update(dt, player, this.mobs);

// --- ЛОГИКА ВЗАИМОДЕЙСТВИЯ С МОБОМ ---
if (player.hp > 0 && !mob.isDead) {
    const dx = (player.x + player.size / 2) - (mob.x + mob.width / 2);
    const dy = (player.y + player.size / 2) - (mob.y + mob.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Если произошло столкновение (дистанция меньше порога)
    if (dist < 40) {
        // 1. ПРОВЕРКА НА ПРЫЖОК СВЕРХУ
        // Проверяем: нижняя точка игрока выше «плеч» моба И игрок падает вниз (velocityY > 0)
        const isJumpingOnTop = (player.y + player.size) < (mob.y + mob.height * 0.5) && player.velocityY > 0;

        if (isJumpingOnTop) {
            // Игрок прыгнул сверху! 
            mob.takeDamage(10); // Наносим урон мобу (если в Mob.js есть такой метод)
            player.velocityY = -12; // Заставляем игрока подпрыгнуть от моба (как в Марио)
            
            // Можно добавить частицы или звук прыжка
            console.log("Напрыгнул сверху!"); 
        } 
        // 2. ОБЫЧНЫЙ УРОН (если не прыгнули сверху и нет неуязвимости)
        else if (player.invulnerableTimer <= 0) {
            player.hp -= 1;
            player.invulnerableTimer = 60; 

            // Отталкивание игрока (knockback)
            const kDir = Math.sign(dx);
            player.velocityX = kDir * 10;
        }
    }
}
        });

        // 2. Очищаем список от удаленных мобов
        this.mobs = this.mobs.filter(mob => !mob.markedForDeletion);
        
        // 3. Уменьшаем таймер неуязвимости игрока
        if (player.invulnerableTimer > 0) {
            player.invulnerableTimer--;
        }

        // 4. Обновляем остальное
        this.updateParticles();
        this.updateDropsLogic(dt, player, player.inventory); 
        this.handleSpawning(player);
    }, // <-- ВОТ ЭТУ СКОБКУ ТЫ ЗАБЫЛ

    updateParticles() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            p.vy += 0.2; 
        });
        this.particles = this.particles.filter(p => p.life > 0);
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

        return chunk.objects.some(obj => 
            (obj.type === "dungeon_wall" || obj.type === "dungeon_block") &&
            x >= obj.x && x <= obj.x + obj.width &&
            y >= obj.y && y <= obj.y + obj.height
        );
    },

    handleSpawning(player) {
        this.spawnTimer++;
        if (this.spawnTimer < 90) return; 
        this.spawnTimer = 0;
        if (this.mobs.length >= this.maxMobs) return;

        const dir = Math.random() > 0.5 ? 1 : -1;
        const spawnX = player.x + dir * (600 + Math.random() * 600);
        let spawnY = player.y + (Math.random() * 400 - 200);

        const inDungeon = this.isPointInDungeon(spawnX, spawnY);
        const biome = world.getBiome(spawnX);
        const currentPool = inDungeon ? SPAWN_CONFIG.dungeon : SPAWN_CONFIG.surface;

        if (!currentPool) return;

        currentPool.forEach(cfg => {
            if (Math.random() < cfg.chance && cfg.check(time, biome)) {
                if (!inDungeon) {
                    const groundY = world.getHeight(spawnX); 
                    if (groundY < 5000) { 
                        const mobH = (cfg.params && cfg.params[0] === true) ? 40 : 30; // Высота зависит от типа
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

    addMob(MobClass, x, y, params = []) {
        const newMob = new MobClass(x, y, ...params);
        this.mobs.push(newMob);
    },

    spawnDungeonMob(x, y) {
        const skel = new JungleSkeleton(x, y);
        this.mobs.push(skel);
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
        // Мобы рисуются здесь (их тоже поправим на Шаге 2)
        this.mobs.forEach(mob => mob.draw(ctx));
        
        // Исправленная отрисовка лута (без - cameraX)
        this.drops.forEach(drop => {
            const drawX = drop.x; // УБРАЛИ ВЫЧИТАНИЕ КАМЕРЫ!
            const drawY = drop.y; // УБРАЛИ ВЫЧИТАНИЕ КАМЕРЫ!
            const hover = Math.sin(Date.now() / 200) * 3;
            
            if (assets.crystal && assets.crystal.complete && assets.crystal.naturalWidth > 0) {
                ctx.drawImage(assets.crystal, drawX, drawY + hover, drop.size, drop.size);
            } else {
                ctx.fillStyle = "#00FFFF"; 
                ctx.fillRect(drawX, drawY + hover, drop.size, drop.size);
                ctx.strokeStyle = "white";
                ctx.lineWidth = 2;
                ctx.strokeRect(drawX, drawY + hover, drop.size, drop.size);
            }
        });

        // Исправленная отрисовка частиц
        this.particles.forEach(p => {
            ctx.fillStyle = p.color || "#39FF14"; 
            ctx.globalAlpha = p.life; 
            // УБРАЛИ ВЫЧИТАНИЕ КАМЕРЫ ЗДЕСЬ ТОЖЕ!
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.globalAlpha = 1.0;
        });
    }
};