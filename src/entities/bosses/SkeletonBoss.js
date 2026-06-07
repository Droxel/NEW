// src/entities/bosses/SkeletonBoss.js
import { world } from "../../world/World.js";
import { SkeletonMinion } from "./SkeletonMinion.js";
import { mobManager } from "../mobs/MobManager.js";

// Импортируем наши разделенные модули
import { spawnParticles, updateProjectilesAndSpikes } from "./skeleton/SkeletonProjectiles.js";
import { chooseNextAttackPhase, handleAttacks, updateHandsSmoothly } from "./skeleton/SkeletonAttacks.js";
import { drawBoss, getLights } from "./skeleton/SkeletonRenderer.js";

export class SkeletonBoss {
    constructor(x, y, scene = null) {
        this.scene = scene;
        this.x = x;
        this.y = y || 0;
        this.startY = this.y;
        this.isAnchored = true;
        
        this.width = 120;
        this.height = 150;
        this.maxHp = 800;
        this.hp = this.maxHp;
        this.isAlive = true;
        this.vy = 0;

        this.state = 'waiting';
        this.stateTimer = 0;
        this.attackPhase = 1;
        this.timers = { death: 0 };
        this.hasDoneShadowPhase = false;

        this.damage = { body: 8, hands: 1, spikes: 5, projectiles: 6 };
        
        this.hands = [
            { id: 'left', x: this.x - 80, y: this.y + 50, vx: 0, vy: 0, offsetX: -120, offsetY: 0, width: 60, height: 60 },
            { id: 'right', x: this.x + this.width + 20, y: this.y + 50, vx: 0, vy: 0, offsetX: 120, offsetY: 0, width: 60, height: 60 }
        ];

        this.projectiles = [];
        this.spikes = [];   
        this.minions = [];
        this.particles = [];
    }

    findGroundY(startX, startY) {
        for (let checkY = startY; checkY < startY + 600; checkY += 20) {
            if (mobManager.isPointInWall(startX, checkY)) return checkY;
        }
        return startY + 400; 
    }

update(player) {
    if (!this.isAlive && this.state !== 'dying') return;

    // 1. Вычисляем уровень земли один раз в начале кадра для всех нужд
    const currentGroundY = this.findGroundY(this.x + this.width / 2, this.y);

    this.stateTimer++;
    this.checkPlayerCollision(player);

    // Переход в Тень
    const hpPct = this.hp / this.maxHp;
    if (hpPct <= 0.10 && !this.hasDoneShadowPhase && this.state !== 'dying' && this.state !== 'waking') {
        this.state = 'shadow';
        this.stateTimer = 0;
        this.vy = 0;
        this.hasDoneShadowPhase = true;
        spawnParticles(this, this.x + this.width/2, this.y + this.height/2, '#000000', 50, 5, {min: 5, max: 15});
    }

    updateProjectilesAndSpikes(this);

    // Теперь currentGroundY доступен здесь
    this.minions.forEach(m => m.update(player, currentGroundY));
    this.minions = this.minions.filter(m => m.isAlive);

    // Машина состояний
    switch (this.state) {
        case 'waiting':
            if (Math.abs(player.x - this.x) < 600) {
                this.state = 'waking';
                this.stateTimer = 0;
            }
            break;

        case 'waking':
            if (this.stateTimer < 300) {
                this.x += (Math.random() - 0.5) * 4;
                this.y -= 0.5;
            } else if (this.stateTimer === 300) {
                spawnParticles(this, this.x + this.width/2, this.y + this.height/2, '#00ccff', 100, 10, {min: 5, max: 10});
            } else if (this.stateTimer > 300 && this.stateTimer < 800) {
                this.hands[0].targetX = this.x - 250;
                this.hands[1].targetX = this.x + this.width + 250;
                spawnParticles(this, this.x + this.width/2, this.y + this.height/2, '#00ccff', 1, 1);
            } else if (this.stateTimer >= 800 && this.stateTimer < 900) {
                this.vy += 0.8;
                this.y += this.vy;
                if (mobManager.isPointInWall(this.x + this.width/2, this.y + this.height)) {
                    this.y -= this.vy;
                    this.vy = 0;
                    if (this.stateTimer === 899) spawnParticles(this, this.x + this.width/2, this.y + this.height, '#ffffff', 50, 4);
                }
            }

            if (this.stateTimer >= 900) {
                this.state = 'fighting';
                this.stateTimer = 0;
            }
            updateHandsSmoothly(this);
            break;

        case 'fighting':
            handleAttacks(this, player, currentGroundY); 
            updateHandsSmoothly(this);

            if (this.stateTimer > 400) {
                chooseNextAttackPhase(this, hpPct);
                this.stateTimer = 0;
            }
            break;
            
        case 'shadow':
            if (this.stateTimer % 50 === 0 && this.minions.length < 10) {
                let spawnX = this.x + (Math.random() - 0.5) * 800;
                let minionGround = this.findGroundY(spawnX, this.y);
                spawnParticles(this, spawnX, minionGround - 50, '#000000', 20, 2);
                this.minions.push(new SkeletonMinion(spawnX, minionGround - 100, player));
            }
            
            this.y += Math.sin(this.stateTimer * 0.05) * 1;
            updateHandsSmoothly(this);

            if (this.stateTimer >= 900) {
                this.state = 'fighting';
                this.stateTimer = 0;
                spawnParticles(this, this.x + this.width/2, this.y + this.height/2, '#00ccff', 50, 5);
            }
            break;

        case 'dying': {
            this.timers.death++;
            const t = this.timers.death;
            
            // В первый кадр смерти даем импульс
            if (t === 1) {
                this.vy = -6; 
                this.hands.forEach((h, index) => {
                    h.vx = index === 0 ? -12 - Math.random() * 5 : 12 + Math.random() * 5;
                    h.vy = -10 - Math.random() * 5;
                });
                this.portalY = this.y - 180; 
            }

            // Фаза 1: Разлет и падение на пол
            if (t < 200) {
                this.vy += 0.8; 
                if (this.y + this.height < currentGroundY) {
                    this.y += this.vy;
                } else {
                    this.y = currentGroundY - this.height;
                    this.vy = 0;
                }
                
                this.hands.forEach(h => {
                    if (!h) return;
                    h.vy += 0.8;
                    h.x += h.vx || 0;
                    if (h.y + h.height < currentGroundY) {
                        h.y += h.vy;
                    } else {
                        h.y = currentGroundY - h.height;
                        h.vy = -(h.vy * 0.3);
                        h.vx *= 0.85;
                    }
                    h.targetX = h.x; h.targetY = h.y;
                });
            }

            const portalX = this.x + this.width / 2;
            const pullObject = (obj, startT, endT) => {
                if (t >= startT && t < endT && obj && obj.width > 0) {
                    obj.x += (portalX - (obj.x + obj.width/2)) * 0.15;
                    obj.y += (this.portalY - (obj.y + obj.height/2)) * 0.15;
                    obj.width *= 0.85;
                    obj.height *= 0.85;
                    if (t % 2 === 0) spawnParticles(this, obj.x + obj.width/2, obj.y + obj.height/2, '#00ccff', 2, 8);
                }
            };

            pullObject(this.hands[0], 180, 240);
            pullObject(this.hands[1], 220, 280);
            pullObject(this, 260, 320);

            if (t > 350) {
                this.isAlive = false;
            }
            break;
        }
    }
}

takeDamage(amount) {
    if (this.state === 'waking' || this.state === 'dying' || this.state === 'shadow') return;

    const shadowThreshold = this.maxHp * 0.10;
    if (!this.hasDoneShadowPhase && (this.hp - amount) <= shadowThreshold) {
        this.hp = shadowThreshold; 
        return; 
    }

    this.hp -= amount;
    if (this.hp <= 0 && this.state !== 'dying') {
        this.state = 'dying';
        this.timers.death = 0;
        this.projectiles = []; 
        this.spikes = [];
        this.minions.forEach(m => m.isAlive = false);
    }
}
    checkPlayerCollision(player) {
        if (!player || this.state === 'dying' || this.state === 'waking' || this.state === 'shadow') return;

        const checkHit = (rect) => {
            const pWidth = player.width || 32;
            const pHeight = player.height || 48;
            return (rect.x < player.x + pWidth &&
                    rect.x + (rect.width || 30) > player.x &&
                    rect.y < player.y + pHeight &&
                    rect.y + (rect.height || 30) > player.y);
        };

        const hitPlayer = (damage) => {
            if (player.takeDamage) player.takeDamage(damage);
        };

        if (checkHit(this)) hitPlayer(this.damage.body);

        this.hands.forEach(hand => {
            if (checkHit(hand)) hitPlayer(this.damage.hands);
        });

        this.spikes.forEach(s => {
            if (s.state === 'active') {
                const spikeRect = { x: s.x - 20, y: s.y - 150, width: 40, height: 150 };
                if (checkHit(spikeRect)) hitPlayer(this.damage.spikes);
            }
        });

        this.projectiles.forEach(p => {
            const projRect = { x: p.x - 18, y: p.y - 18, width: 36, height: 36 };
            if (checkHit(projRect)) {
                hitPlayer(this.damage.projectiles);
                p.life = 0;
                spawnParticles(this, p.x, p.y, '#00ccff', 15, 2);
            }
        });
    }

takeDamage(amount) {
        if (this.state === 'waking' || this.state === 'dying' || this.state === 'shadow') return;

        // ЗАЩИТА ОТ ВАНШОТА: не даем убить босса до теневой фазы
        const shadowThreshold = this.maxHp * 0.10;
        if (!this.hasDoneShadowPhase && (this.hp - amount) <= shadowThreshold) {
            this.hp = shadowThreshold; // Оставляем ровно 10% для триггера фазы
            return; // Урон дальше не проходит, ждем когда update() включит тень
        }

        this.hp -= amount;
        if (this.hp <= 0 && this.state !== 'dying') {
            this.state = 'dying';
            this.timers.death = 0;
            this.projectiles = []; 
            this.spikes = [];
            this.minions.forEach(m => m.isAlive = false);
        }
    }

    getHitboxes() {
        if (!this.isAlive || this.state === 'waking' || this.state === 'shadow' || this.state === 'dying') {
            return []; 
        }
        return [
            { x: this.x, y: this.y, width: this.width, height: this.height }, 
            this.hands[0], 
            this.hands[1]
        ];
    }

    // Делегируем вызовы в вынесенные файлы
    getLights() { return getLights(this); }
    draw(ctx, assets) { drawBoss(this, ctx, assets); }
}