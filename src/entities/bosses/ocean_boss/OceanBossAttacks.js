// Файл: src/entities/bosses/ocean_boss/OceanBossAttacks.js
import { LaserBeam, HomingCyclone } from "./OceanProjectiles.js";
import { BOSS_CONFIG } from "./OceanBoss.js";

export class OceanBossAttacks {
    constructor(boss) {
        this.boss = boss;
        this.currentAttack = 'idle';
        this.attackState = 'none';
        this.timer = 0;
        this.cooldown = 1; 
        this.comboQueue = [];
        this.dashCounter = 0;
        
        // Для акульего кружения
        this.targetHoverX = boss.x;
        this.targetHoverY = boss.y;
    }

    startFirstAttack() {
        this.cooldown = 0.5;
    }

update(player, dt) {
        if (this.currentAttack === 'idle') {
            this.cooldown -= dt;
            if (this.cooldown <= 0) this.chooseNextAttack(player);
            
            // Динамичное "акулье" движение
            if (Math.random() < 0.02) {
                this.targetHoverX = player.x + (Math.random() > 0.5 ? 400 : -400);
                this.targetHoverY = player.y - 200 + (Math.random() * 200);
            }
            this.boss.x += (this.targetHoverX - this.boss.x) * 2 * dt;
            this.boss.y += (this.targetHoverY - this.boss.y) * 2 * dt;
            this.boss.alpha += (1 - this.boss.alpha) * 5 * dt;
            
            // ДОБАВЛЕНО: Плавное покачивание (эффект дыхания/парения)
            this.boss.rotation = Math.sin(Date.now() / 400) * 0.1; 
            
            return;
        }

        switch(this.currentAttack) {
            case 'ram': this.updateRam(player, dt); break;
            case 'laser': this.updateLaser(player, dt); break;
            case 'cyclone': this.updateCyclone(player, dt); break;
        }
    }

    chooseNextAttack(player) {
        if (this.comboQueue.length > 0) {
            const next = this.comboQueue.shift();
            this.startAttack(next, player);
            return;
        }

        const rand = Math.random();
        if (this.boss.phase === 1) {
            if (rand < 0.5) this.startAttack('ram', player);
            else this.startAttack('cyclone', player);
        } else if (this.boss.phase === 2) {
            if (rand < 0.3) { this.comboQueue = ['ram', 'laser']; this.startAttack('ram', player); }
            else if (rand < 0.6) { this.comboQueue = ['cyclone', 'ram']; this.startAttack('cyclone', player); }
            else this.startAttack('laser', player);
        } else {
            // Безжалостная 3 фаза
            if (rand < 0.4) { this.comboQueue = ['laser', 'cyclone', 'ram', 'ram']; this.startAttack('laser', player); }
            else if (rand < 0.8) { this.comboQueue = ['cyclone', 'ram', 'ram', 'laser']; this.startAttack('cyclone', player); }
            else this.startAttack('ram', player);
        }
    }

    startAttack(attackName, player) {
        this.currentAttack = attackName;
        this.attackState = 'telegraph';
        
        if (attackName === 'ram') {
            this.timer = 0.5; // Очень короткая задержка!
            this.dashCounter = BOSS_CONFIG.dashCount[`phase${this.boss.phase}`];
            this.dashDir = this.boss.x > player.x ? 1 : -1; 
        } 
        else if (attackName === 'laser') {
            this.timer = BOSS_CONFIG.laserChargeTime; 
            this.laserAngle = Math.atan2(player.y - this.boss.y, player.x - this.boss.x);
            this.activeLaser = new LaserBeam(this.boss);
            this.boss.myProjectiles.push(this.activeLaser); // В личный массив!
        }
        else if (attackName === 'cyclone') {
            this.timer = 0.3; 
            this.cyclonesToSpawn = BOSS_CONFIG.cycloneCount[`phase${this.boss.phase}`];
        }
    }

updateRam(player, dt) {
        if (this.attackState === 'telegraph') {
            this.timer -= dt;
            this.boss.alpha -= 5 * dt; 
            if (this.boss.alpha < 0) this.boss.alpha = 0;
            
            const offsetX = this.dashDir * 800; 
            this.boss.x += ((player.x + offsetX) - this.boss.x) * 10 * dt;
            this.boss.y += (player.y - this.boss.y) * 10 * dt; 
            
            // ДОБАВЛЕНО: Кренится назад перед ударом
            this.boss.rotation = -this.dashDir * 0.2;

            if (this.timer <= 0) {
                this.attackState = 'active';
                this.timer = 1.0; 
                this.dashDir = Math.sign(player.x - this.boss.x); 
                this.boss.alpha = 1; 
                this.startX = this.boss.x; 
            }
        } 
        else if (this.attackState === 'active') {
            this.timer -= dt;
            const speed = BOSS_CONFIG.dashSpeed[`phase${this.boss.phase}`];
            
            this.boss.x += this.dashDir * speed * dt; 
            
            // ДОБАВЛЕНО: Агрессивный наклон вперед при рывке
            this.boss.rotation = this.dashDir * 0.4; 
            
            if (this.timer <= 0 || Math.abs(this.boss.x - player.x) > 1000) {
                this.dashCounter--;
                if (this.dashCounter > 0) {
                    this.attackState = 'telegraph';
                    this.timer = 0.3; 
                    this.dashDir = this.boss.x > player.x ? 1 : -1;
                } else {
                    this.finishAttack();
                }
            }
        }
    }

updateLaser(player, dt) {
        if (this.attackState === 'telegraph') {
            this.timer -= dt;
            const targetAngle = Math.atan2(player.y - this.boss.y, player.x - this.boss.x);
            this.laserAngle += (targetAngle - this.laserAngle) * 8 * dt;
            this.activeLaser.updateTelegraph(this.laserAngle);

            // ДОБАВЛЕНО: Поворачиваем тело босса слегка в сторону лазера
            this.boss.rotation = Math.sin(this.laserAngle) * 0.2;

            if (this.timer <= 0) {
                this.attackState = 'active';
                this.timer = BOSS_CONFIG.laserDuration[`phase${this.boss.phase}`];
                this.activeLaser.fire(this.laserAngle);
                this.boss.scene?.camera?.shake?.(10, this.timer); 
            }
        } 
        else if (this.attackState === 'active') {
            this.timer -= dt;
            
            const targetAngle = Math.atan2(player.y - this.boss.y, player.x - this.boss.x);
            const rotSpeed = this.boss.phase === 3 ? 1.5 : 0.5;
            this.laserAngle += Math.sign(targetAngle - this.laserAngle) * rotSpeed * dt;
            this.activeLaser.updateAngle(this.laserAngle);
            
            // ДОБАВЛЕНО: Тряска самого босса при стрельбе
            this.boss.rotation = Math.sin(this.laserAngle) * 0.2 + (Math.random() - 0.5) * 0.1;

            if (this.timer <= 0) {
                this.activeLaser.destroy();
                this.finishAttack();
            }
        }
    }
    updateCyclone(player, dt) {
        if (this.attackState === 'telegraph') {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.attackState = 'active';
                this.timer = 0.1; 
            }
        } 
        else if (this.attackState === 'active') {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.timer = 0.1; // Пулеметный спавн
                this.cyclonesToSpawn--;
                
                const angle = Math.random() * Math.PI * 2;
                const dist = 150;
                const cx = this.boss.x + Math.cos(angle) * dist;
                const cy = this.boss.y + Math.sin(angle) * dist;
                
                const cyclone = new HomingCyclone(cx, cy, player, this.boss.phase);
                this.boss.myProjectiles.push(cyclone); // В личный массив!

                if (this.cyclonesToSpawn <= 0) {
                    this.finishAttack();
                }
            }
        }
    }

    finishAttack() {
        this.currentAttack = 'idle';
        this.attackState = 'none';
        this.cooldown = this.comboQueue.length > 0 ? 0.2 : 0.8;
    }
}