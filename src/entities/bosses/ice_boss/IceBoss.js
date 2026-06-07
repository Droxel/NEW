// entities/bosses/ice_boss/IceBoss.js
import { CONFIG } from "../../../data/config.js";
import { world } from "../../../world/World.js";
import { Boss } from "../Boss.js";
import { FreezeCloud } from "./IceProjectiles.js";
import { ShieldCrystal } from "./BossCrystals.js";
import { IceBossRenderer } from "./IceBossRenderer.js";
import { IceBossAttacks } from "./IceBossAttacks.js";
import { audioManager } from "../../../core/AudioManager.js";

export class IceBoss extends Boss {
    constructor(x, y) {
        super({ x, y, hp: 1500 });
        
        this.maxHp = 1500; 
        this.size = 120;
        this.baseColor = "#aaddff";
        
        this.shields = [
            new ShieldCrystal(-100, -80), 
            new ShieldCrystal(100, -80)  
        ];
        this.activeShields = 2;
        this.isInvulnerable = true;

        this.velocityX = 0;
        this.velocityY = 0;
        this.gravity = CONFIG.gravity;
        
        this.projectiles = [];
        this.clouds = [];
        
        this.timers = { attack: 100, death: 0 };
        this.currentPhase = 1; 
        this.attackCycle = 0; 
        
        this.anim = {
            crystalScaleX: 1,
            crystalScaleY: 1,
            auraAlpha: 0,
            glowColor: "rgba(255, 255, 255, 0)"
        };

        this.targets = {
            scaleX: 1,
            scaleY: 1,
            alpha: 0,
            color: [255, 255, 255] 
        };
    
        this.scaleX = 1;
        this.scaleY = 1;

        // Подключаем модули
        this.renderer = new IceBossRenderer(this);
        this.attacker = new IceBossAttacks(this);
    }

    lerp(current, target, speed) {
        return current + (target - current) * speed;
    }

    getNextAttackType() {
        if (this.currentPhase < 4) {
            return "sky_icicles"; 
        }
        return ["surround", "blocks", "minigun", "jump"][this.attackCycle];
    }

    update(player, dt) {
        if (!this.isAlive) {
            this.animateDeath();
            return;
        }

        this.projectiles.forEach(p => p.update(player));
        this.projectiles = this.projectiles.filter(p => p.isAlive);
        this.clouds.forEach(c => c.update(player));
        this.clouds = this.clouds.filter(c => c.isAlive);

        this.shields.forEach(shield => {
            shield.update(this.x, this.y);
            if (!shield.isBroken && this.checkShieldHit(player, shield)) {
                const justBroke = shield.takeDamage(1);
                if (player.velocityY > 0) player.velocityY = -10; 
                if (justBroke) this.handleShieldBreak(player);
            }
        });

        this.handlePhases(player);

        if (this.currentPhase === 4) {
            this.applyPhysics();
            this.checkGroundCollision();
            this.checkPlayerCollision(player); 
            
            if (this.isAlive) {
                this.renderer.updateTelegraphing();
            }
            
            this.anim.crystalScaleX = this.lerp(this.anim.crystalScaleX, this.targets.scaleX, 0.1);
            this.anim.crystalScaleY = this.lerp(this.anim.crystalScaleY, this.targets.scaleY, 0.1);
            this.anim.auraAlpha = this.lerp(this.anim.auraAlpha, this.targets.alpha, 0.1);
        }
    }

    handleShieldBreak(player) {
        this.activeShields--;
        
        const knockbackForceX = this.activeShields === 0 ? 60 : 25; 
        const knockbackForceY = this.activeShields === 0 ? -25 : -12;
        
        const dir = Math.sign(player.x - this.x) || 1;
        player.velocityX = dir * knockbackForceX;
        player.velocityY = knockbackForceY;

        if (this.activeShields === 1) {
            this.currentPhase = 3; 
        } else if (this.activeShields === 0) {
            this.currentPhase = 4; 
            this.isInvulnerable = false;
        }
    }

    handlePhases(player) {
        this.timers.attack--;

 if (this.currentPhase === 1 || this.currentPhase === 2) {
    if (this.timers.attack <= 0) {
        if (Math.random() > 0.3) {
            this.attacker.spawnSkyIcicle(player);
            // Добавляем здесь:
            audioManager.playSFX('boss/ice_boss/shot.wav', 0.1); 
        } else {
            this.attacker.spawnIceBlock(player);
        }
        this.timers.attack = 50; 
    }
}

if (this.currentPhase === 3) {
    if (this.timers.attack <= 0) {
        this.attacker.spawnSkyIcicle(player); 
        audioManager.playSFX('boss/ice_boss/shot.wav', 0.2); // Звук выстрела
        
        if (Math.random() > 0.5) this.attacker.spawnSkyIcicle(player); 
        
        if (Math.random() > 0.4) {
            this.attacker.crystalShootDirect(player, 0.2); 
            audioManager.playSFX('boss/ice_boss/shot.wav', 0.2); // Кристалл стреляет громче
        }
        this.timers.attack = 25; 
    }
}
        if (this.currentPhase === 4) {
            if (this.timers.attack <= 0) {
                this.attacker.executePhase4Attack(player);
            }
        }
    }

    applyPhysics() {
        if (this.velocityY < 15) this.velocityY += this.gravity;
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityX *= 0.95; 
    }

    checkGroundCollision() {
        const groundY = world.getHeight(this.x);
        if (this.y >= groundY) {
            this.y = groundY;
            this.velocityY = 0;
            this.velocityX = 0;

            if (this.wantsToSpawnCloud) {
                this.clouds.push(new FreezeCloud(this.x, this.y));
                this.wantsToSpawnCloud = false;
            }
        }
    }

    takeDamage(amount) {
        if (this.isInvulnerable || !this.isAlive) return false;

        this.hp -= amount;
        if (this.hp <= 0) {
            this.isAlive = false;
        }
        return true;
    }

    checkShieldHit(player, target) {
        const dist = Math.hypot(player.x - target.x, player.y - target.y);
        const isStandardHit = player.isAttacking && dist < 80;
        const isJumpHit = player.velocityY > 0 && dist < 60 && player.y < target.y;
        return isStandardHit || isJumpHit;
    }

    checkPlayerCollision(player) {
        if (this.isInvulnerable) return;

        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        
        if (player.isAttacking && dist < this.size) {
            this.hp -= 5; 
            player.velocityX = Math.sign(player.x - this.x) * -5; 
        }
        
        if (player.velocityY > 0 && dist < this.size && player.y < this.y - this.size/2) {
            this.hp -= 15; 
            player.velocityY = -15; 
        }

        if (this.hp <= 0) {
            this.isAlive = false;
        }
    }

    animateDeath() {
        this.timers.death++;
        this.scaleY *= 0.95; 
        this.scaleX *= 1.05; 
        this.y += 3;
    }

    draw(ctx) {
        this.renderer.draw(ctx);
    }
}