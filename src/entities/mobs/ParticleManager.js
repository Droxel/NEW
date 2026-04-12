// src/entities/mobs/ParticleManager.js

export const particleManager = {
    particles: [],

    update() {
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

    draw(ctx, leftView, rightView) {
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