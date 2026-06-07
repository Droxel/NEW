// src/entities/mobs/DropManager.js
import { world } from "../../world/World.js";
import { CONFIG } from "../../data/config.js";
import { assets } from "../../core/Braw.js";
import { mobSpawner } from "./MobSpawner.js"; 

export const dropManager = {
    drops: [],

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

    update(dt, player, playerInventory) {
        const currentTime = Date.now();
        this.drops.forEach(drop => {
            drop.vy += CONFIG.gravity;
            drop.x += drop.vx;
            drop.y += drop.vy;
            drop.vx *= 0.95; 

            let hitFloor = false;

            // Используем утилиты коллизии из спавнера
            if (mobSpawner.isPointInDungeon(drop.x, drop.y)) {
                if (mobSpawner.isPointInWall(drop.x + drop.size / 2, drop.y + drop.size)) {
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
            const distSq = dx*dx + dy*dy; 

            if (currentTime - drop.createdAt < 700) return; 

            if (distSq < 22500) { // 150 * 150
                const dist = Math.sqrt(distSq); 
                drop.x += (dx / dist) * 8;
                drop.y += (dy / dist) * 8;
            }

            if (distSq < 900) { // 30 * 30
                if (playerInventory) {
                    const success = playerInventory.addCrystal(1);
                    if (success) drop.pickedUp = true;
                }
            }
        });
        
        this.drops = this.drops.filter(d => !d.pickedUp);
    },

    draw(ctx, leftView, rightView) {
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
    }
};