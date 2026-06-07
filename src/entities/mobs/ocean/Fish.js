//Fish.js
import { BaseSeaCreature } from "./BaseSeaCreature.js";

export class Fish extends BaseSeaCreature {
    constructor(x, y, type) {
        // Твои 100x70 уменьшаем до игровых 40x28
        const baseW = 40; 
        const baseH = 28; 

        super(x, y, baseW, baseH);
        this.type = type;
        this.imgKey = type === "clownfish" ? "clownfish" : "dory";
        this.wanderTimer = 0;
    }

    update(dt, player, world) {
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        
        if (distToPlayer > 200) {
            this.wanderTimer -= dt;
            if (this.wanderTimer <= 0) {
                const angle = Math.random() * Math.PI * 2;
                this.targetVx = Math.cos(angle) * this.speed;
                this.targetVy = Math.sin(angle) * (this.speed * 0.4);
                this.wanderTimer = 2 + Math.random() * 3;
            }
            this.vx += (this.targetVx - this.vx) * 0.03;
            this.vy += (this.targetVy - this.vy) * 0.03;
        }

        super.update(dt, player, world);
    }
}