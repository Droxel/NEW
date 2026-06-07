// src/entities/bosses/skeleton/SkeletonAttacks.js
import { SkeletonMinion } from '../SkeletonMinion.js';
import { spawnParticles } from './SkeletonProjectiles.js';

export function chooseNextAttackPhase(boss, hpPct) {
    let possible = [1]; 
    if (hpPct <= 0.75 && hpPct > 0.50) possible.push(2); 
    if (hpPct <= 0.50 && hpPct > 0.30) possible.push(3); 
    if (hpPct <= 0.40 && hpPct > 0.20) possible.push(4); 
    if (hpPct <= 0.20 && hpPct > 0.10) possible.push(5); 
    
    boss.attackPhase = possible[Math.floor(Math.random() * possible.length)];
}

export function updateHandsSmoothly(boss) {
    boss.hands.forEach((h, index) => {
        let tx = h.targetX !== undefined ? h.targetX : boss.x + h.offsetX;
        let ty = h.targetY !== undefined ? h.targetY : boss.y + h.offsetY;

        // Эффект "Скелетрона": добавляем органичное покачивание/парение
        const time = boss.stateTimer * 0.05;
        const floatX = Math.cos(time + index * Math.PI) * 15; 
        const floatY = Math.sin(time + index * Math.PI) * 20;

        h.x += (tx + floatX - h.x) * 0.05;
        h.y += (ty + floatY - h.y) * 0.05;
    });
}

export function handleAttacks(boss, player, groundY) {
    const targetX = player.x + (boss.x < player.x ? -200 : 200);
    const targetY = player.y - 150; 

    boss.x += (targetX - boss.x) * 0.03;
    boss.y += (targetY - boss.y) * 0.03;

    switch (boss.attackPhase) {
        case 1: // Скелетрон-стайл: размашистые удары по очереди
            const cycle = boss.stateTimer % 240;
            if (cycle < 60) {
                boss.hands[0].targetX = boss.x - 150; boss.hands[0].targetY = boss.y - 100;
                boss.hands[1].targetX = boss.x + boss.width + 150; boss.hands[1].targetY = boss.y - 100;
            } else if (cycle < 100) {
                boss.hands[0].targetX = player.x; boss.hands[0].targetY = player.y + 20;
                boss.hands[1].targetX = boss.x + boss.width + 150; boss.hands[1].targetY = boss.y - 50;
            } else if (cycle < 160 && cycle >= 120) {
                boss.hands[1].targetX = player.x; boss.hands[1].targetY = player.y + 20;
                boss.hands[0].targetX = boss.x - 150; boss.hands[0].targetY = boss.y - 50;
            } else if (cycle >= 160) {
                boss.hands[0].targetX = boss.x - 100; boss.hands[0].targetY = boss.y + 50;
                boss.hands[1].targetX = boss.x + boss.width + 100; boss.hands[1].targetY = boss.y + 50;
            }
            break;

        case 2: // Огненные шары из тела
            boss.hands[0].targetY = boss.y + 100; 
            boss.hands[1].targetY = boss.y + 100;
            if (boss.stateTimer % 50 === 0) {
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI / 4) + (i * Math.PI / 8);
                    boss.projectiles.push({
                        x: boss.x + boss.width / 2, y: boss.y + boss.height / 2,
                        vx: Math.cos(angle) * 12, vy: Math.sin(angle) * 12, life: 300
                    });
                }
                spawnParticles(boss, boss.x + boss.width/2, boss.y + boss.height/2, '#00ccff', 20, 5);
            }
            break;

        case 3: // Энергетические шары
            boss.hands[0].targetX = boss.x - 200; boss.hands[1].targetX = boss.x + boss.width + 200;
            boss.hands[0].targetY = boss.y; boss.hands[1].targetY = boss.y;
            if (boss.stateTimer % 80 === 0 && boss.stateTimer > 50) {
                boss.hands.forEach(h => {
                    spawnParticles(boss, h.x, h.y, '#00ccff', 20, 3);
                    const dx = player.x - h.x; const dy = player.y - h.y;
                    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                    boss.projectiles.push({ x: h.x, y: h.y, vx: (dx/dist) * 12, vy: (dy/dist) * 12, life: 300 });
                });
            }
            break;

case 4: // Призыв прислужников (Постепенный)
    // Спавним одного миньона каждые 60 кадров (1 секунда)
    // И только если их меньше 10, чтобы не лагало
    if (boss.stateTimer % 60 === 0 && boss.minions.length < 10) {
        let spawnX = boss.x + (Math.random() - 0.5) * 600;
        let mGround = boss.findGroundY(spawnX, boss.y);
        
        spawnParticles(boss, spawnX, mGround, '#ffffff', 20, 3);
        // Передаем только нужные параметры
        boss.minions.push(new SkeletonMinion(spawnX, mGround - 100, player)); 
    }
    break;

        case 5: // Ярость
            if (boss.stateTimer % 70 === 0) {
                boss.dashTargetX = player.x;
                spawnParticles(boss, boss.x + boss.width/2, boss.y + boss.height, '#ff0000', 10, 2);
            } else if (boss.stateTimer % 70 > 20 && boss.stateTimer % 70 < 35) {
                const dx = boss.dashTargetX - boss.x;
                boss.x += Math.sign(dx) * 45; 
            }
            boss.hands[0].targetX = boss.x - 20; boss.hands[0].targetY = boss.y + 50;
            boss.hands[1].targetX = boss.x + boss.width + 20; boss.hands[1].targetY = boss.y + 50;
            break;
    }
}