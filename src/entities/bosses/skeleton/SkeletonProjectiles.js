// src/entities/bosses/skeleton/SkeletonProjectiles.js
import { mobManager } from "../../mobs/MobManager.js"; // <-- ДОБАВЬ ЭТУ СТРОКУ

export function spawnParticles(boss, x, y, color, count, speed = 2, sizeObj = {min: 2, max: 5}) {
    for(let i = 0; i < count; i++) {
        boss.particles.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.03,
            color: color,
            size: sizeObj.min + Math.random() * (sizeObj.max - sizeObj.min)
        });
    }
}

export function updateProjectilesAndSpikes(boss) {
    // Обновление частиц
    boss.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
    });
    boss.particles = boss.particles.filter(p => p.life > 0);

// Обновление снарядов (теперь с отскоками)
    boss.projectiles.forEach(p => {
        const nextX = p.x + p.vx;
        const nextY = p.y + p.vy;

        // Проверка столкновения со стенами по горизонтали
        if (mobManager.isPointInWall(nextX + Math.sign(p.vx) * 15, p.y)) {
            p.vx *= -0.7; // Отскок и потеря 30% энергии
            spawnParticles(boss, p.x, p.y, '#00ccff', 5, 2);
        } else {
            p.x = nextX;
        }

        // Проверка столкновения по вертикали
        if (mobManager.isPointInWall(p.x, nextY + Math.sign(p.vy) * 15)) {
            p.vy *= -0.7; // Отскок и потеря 30% энергии
            spawnParticles(boss, p.x, p.y, '#00ccff', 5, 2);
        } else {
            p.y = nextY;
        }

        p.life--;
        
        // Если шар почти остановился, он исчезает раньше времени
        if (Math.abs(p.vx) + Math.abs(p.vy) < 1.5) p.life = 0;

        spawnParticles(boss, p.x, p.y, '#00ccff', 1, 0.5, {min: 2, max: 4});
    });
    boss.projectiles = boss.projectiles.filter(p => p.life > 0);

    // Очищаем массив шипов (они нам больше не нужны)
    boss.spikes = [];
}