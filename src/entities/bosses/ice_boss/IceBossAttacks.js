// entities/bosses/ice_boss/IceBossAttacks.js
import { Icicle, IceBlock, FreezeCloud } from "./IceProjectiles.js";

export class IceBossAttacks {
    constructor(boss) {
        this.boss = boss;
    }

    executePhase4Attack(player) {
        switch(this.boss.attackCycle) {
            case 0: 
                this.surroundAndShootAttack(player); 
                this.boss.timers.attack = 180; 
                break;
            case 1: 
                this.spawnIceBlock(player, true); 
                this.boss.timers.attack = 120;
                break;
            case 2:
                this.startMiniGun(player);
                this.boss.timers.attack = 180;
                break;
            case 3:
                this.bossJumpAndFreezeCloud(player);
                this.boss.timers.attack = 150;
                break;
        }
        this.boss.attackCycle = (this.boss.attackCycle + 1) % 4;
    }

    spawnSkyIcicle(player) {
        const dropX = player.x + (Math.random() * 600 - 300);
        this.boss.projectiles.push(new Icicle(dropX, player.y - 800));
    }

    spawnIceBlock(player, isAggressive = false) {
        const count = isAggressive ? (Math.random() > 0.5 ? 2 : 1) : 1;
        
        for(let i = 0; i < count; i++) {
            const range = isAggressive ? 600 : 400;
            const dropX = player.x + (Math.random() * range - range/2);
            const dropY = player.y - 900 - (i * 200);
            this.boss.projectiles.push(new IceBlock(dropX, dropY));
        }
    }

    crystalShootDirect(player, accuracy = 0.8) {
        const crystalY = this.boss.y - this.boss.size - 25;
        this.boss.projectiles.push(new Icicle(this.boss.x, crystalY, player.x, player.y, accuracy));
    }

    surroundAndShootAttack(player) {
        const numIcicles = 10; 
        const radius = 110;    
        const crystalY = this.boss.y - this.boss.size - 25;

        for (let i = 0; i < numIcicles; i++) {
            const angle = (Math.PI * 2 / numIcicles) * i;
            const startX = this.boss.x + Math.cos(angle) * radius;
            const startY = crystalY + Math.sin(angle) * radius;
            
            let icicle = new Icicle(startX, startY);
            icicle.isHovering = true; 
            icicle.hoverAngle = angle; 
            
            this.boss.projectiles.push(icicle);

            setTimeout(() => {
                if (!this.boss.isAlive || !icicle.isAlive) return;
                icicle.setTarget(player.x, player.y, 0.9);
            }, 1500 + i * 80); 
        }
    }

    startMiniGun(player) {
        let shots = 0;
        const gunInterval = setInterval(() => {
            if (!this.boss.isAlive || shots > 12) {
                clearInterval(gunInterval);
                return;
            }
            this.crystalShootDirect(player, 0.7);
            shots++;
        }, 120); 
    }

    bossJumpAndFreezeCloud(player) {
        const dir = Math.sign(player.x - this.boss.x) || 1;
        this.boss.velocityX = dir * 10;
        this.boss.velocityY = -22;
        this.boss.wantsToSpawnCloud = true; 
    }
}