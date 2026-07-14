// Файл: src/entities/bosses/ocean_boss/OceanBoss.js
import { Boss } from "../Boss.js";
import { OceanBossRenderer } from "./OceanBossRenderer.js";
import { OceanBossAttacks } from "./OceanBossAttacks.js";
import { OceanBossKraken } from "./OceanBossKraken.js";

// ХАРДКОРНАЯ НАСТРОЙКА БАЛАНСА
export const BOSS_CONFIG = {
    maxHp: 500,
    contactDamage: 1,
    phase2Threshold: 0.70,
    phase3Threshold: 0.35,
    
    crystalOffsetX: 0,
    crystalOffsetY: -15, 
    
    dashSpeed: { phase1: 2000, phase2: 2800, phase3: 4000 },
    dashCount: { phase1: 3, phase2: 4, phase3: 6 },
    
    laserChargeTime: 0.8,
    laserDuration: { phase1: 1.5, phase2: 2, phase3: 3 },
    
    cycloneCount: { phase1: 6, phase2: 10, phase3: 15 }
};

export class OceanBoss extends Boss {
    constructor(x, y, scene) {
        super({ x, y, hp: BOSS_CONFIG.maxHp }); 
        this.scene = scene;
        
        this.width = 250;
        this.height = 350;
        
        this.crystalOffsetX = BOSS_CONFIG.crystalOffsetX;   
        this.crystalOffsetY = BOSS_CONFIG.crystalOffsetY; 
        
        this.renderer = new OceanBossRenderer(this);
        this.attacks = new OceanBossAttacks(this);
        
        this.state = 'spawning'; 
        this.phase = 1; 
        this.spawnTimer = 0;
        this.eyeState = 0;
        this.invulTimer = 0; 
        
        this.targetY = y - this.height / 2;
        this.y = this.targetY + 400; 
        
        this.alpha = 1; 
        this.rotation = 0; 
        
        this.krakenPhaseDone = false;
        this.krakenActive = false;
        this.maxSphereHp = 1000; 
        this.sphereHp = 0;
        this.krakenInstance = null;
        
        this.myProjectiles = [];
        this.active = true; // Флаг жизненного цикла сущности для сцены
    }

    // МЕТОД ДЛЯ ВОСПРОИЗВЕДЕНИЯ ЗВУКА ВОЯ КРАКЕНА
    playKrakenHowl() {
        try {
            const howl = new Audio('assets/audio/sfx/boss/kreken/rev_cracken.mp3');
            howl.volume = 0.85;
            howl.play().catch(err => console.log("Аудио не смогло воспроизвестись (нужен клик по экрану):", err));
        } catch (e) {
            console.error("Не удалось запустить файл воя Кракена:", e);
        }
    }

    update(player, dt) {
        // 1. АНИМАЦИЯ СМЕРТИ САМОГО БОССА
        if (this.state === 'dying') {
            this.eyeState = 0;      // Закрываем глаза
            this.y += 100 * dt;     // Медленно опускаемся на дно
            this.alpha -= 0.4 * dt; // Постепенно растворяемся в воде
            
            if (this.alpha <= 0) {
                this.alpha = 0;
                // ФИКС ИСЧЕЗНОВЕНИЯ: Когда босс растворился И Кракен уплыл/исчез, полностью удаляем объект
                if (!this.krakenInstance || this.krakenInstance.alpha <= 0) {
                    this.active = false; // Сцена/апдейтер больше не будут трогать этого босса
                    console.log("БОСС И КРАКЕН ПОЛНОСТЬЮ УДАЛЕНЫ ИЗ ПАМЯТИ");
                }
            }
            
            // Даем кракену доиграть анимацию исчезновения, убрали затыку с alpha > 0
            if (this.krakenInstance) {
                this.krakenInstance.update(dt, player);
            }
            return; 
        }

        if (this.invulTimer > 0) this.invulTimer -= dt;

        for (let i = this.myProjectiles.length - 1; i >= 0; i--) {
            let p = this.myProjectiles[i];
            p.update(dt, player);
            if (p.lifeTime <= 0 || p.active === false) {
                this.myProjectiles.splice(i, 1);
            }
        }

        const hpPercent = this.hp / this.maxHp;
        
        // --- ЛОГИКА АКТИВАЦИИ ФАЗЫ КРАКЕНА ---
        if (hpPercent <= 0.30 && !this.krakenPhaseDone && this.phase < 4) {
            this.krakenPhaseDone = true;
            this.krakenActive = true;
            this.sphereHp = this.maxSphereHp;
            
            this.sphereX = this.x; 
            this.sphereY = this.y;

            this.krakenInstance = new OceanBossKraken(this.sphereX, this.sphereY + 800);
            
            // АКТИВАЦИЯ ЗВУКА: Кракен призывается на зов сферы
            this.playKrakenHowl();
            
            // ФИКС ЛАЗЕРА: Жестко сбрасываем атаки и очищаем все снаряды с экрана
            this.attacks.currentAttack = 'idle'; 
            this.attacks.attackState = 'idle'; 
            this.myProjectiles = []; 
            
            // БОСС В СФЕРЕ ЗАКРЫВАЕТ ГЛАЗА
            this.eyeState = 0; 
            
            console.log("СФЕРА АКТИВИРОВАНА! БОСС ВНУТРИ СФЕРЫ! КРАКЕН ЗАЩИЩАЕТ ЕГО!");
        } 
        else if (hpPercent <= BOSS_CONFIG.phase3Threshold && this.phase < 3 && this.krakenPhaseDone) {
            this.phase = 3;
            console.log("ФАЗА 3: ИСТИННАЯ ЯРОСТЬ ОКЕАНА!");
        } 
        else if (hpPercent <= BOSS_CONFIG.phase2Threshold && this.phase < 2) {
            this.phase = 2;
            console.log("ФАЗА 2: ШТОРМ!");
        }

        if (this.state === 'spawning') {
            this.handleSpawn(dt);
        } else if (this.state === 'combat') {
            if (this.krakenActive) {
                // Если босс в сфере, просто фиксируем координаты
                this.sphereX = this.x;
                this.sphereY = this.y;
                this.rotation = 0; 
            } else {
                // Атаки идут только если сферы нет
                this.attacks.update(player, dt);
                this.checkContactDamage(player);
            }

            // ГЛАВНЫЙ ФИКС КРАКЕНА: Убрали условие `this.krakenInstance.alpha > 0`.
            // Теперь Кракен стабильно получает тики dt с самого рождения (когда alpha еще 0) и плавно выплывает.
            if (this.krakenInstance) {
                this.krakenInstance.update(dt, player);
            }
        }
    }

    handleSpawn(dt) {
        this.spawnTimer += dt;
        if (this.y > this.targetY) {
            this.y -= 300 * dt; 
        } else {
            this.y = this.targetY;
        }

        if (this.spawnTimer > 2) {
            this.eyeState = 2; 
            this.state = 'combat'; 
            this.attacks.startFirstAttack();
        } else if (this.spawnTimer > 1) {
            this.eyeState = 1; 
        }
    }

    takeDamage(amount) {
        if (this.invulTimer > 0 || this.state === 'spawning' || this.alpha < 0.5) return;
        
        // Урон по сфере
        if (this.krakenActive) {
            this.sphereHp -= amount;
            this.invulTimer = 0.1; 
            
            if (this.sphereHp <= 0) {
                this.krakenActive = false;
                this.phase = 3; 
                
                // СФЕРА РАЗБИТА - БОСС ОТКРЫВАЕТ ГЛАЗА
                this.eyeState = 2; 
                
                if (this.krakenInstance) this.krakenInstance.swimAway();
                console.log("СФЕРА РАЗБИТА! БОСС УЯЗВИМ!");
            }
            return; 
        }
        
        // Урон по самому боссу
        this.hp -= amount;
        this.invulTimer = 0.1; 
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.state = 'dying';
            this.myProjectiles = []; // Очищаем экран от пуль при смерти босса
        }
    }

    checkContactDamage(player) {
        if (this.alpha < 0.5) return;
        if (Math.abs(player.x - this.x) < this.width / 2 && 
            Math.abs(player.y - this.y) < this.height / 2) {
            if (typeof player.takeDamage === 'function') {
                player.takeDamage(BOSS_CONFIG.contactDamage);
            }
        }
    }

    getLightSources() {
        let sources = [];
        if (this.state !== 'dying' && this.alpha > 0.1) {
            sources.push({
                x: this.x,
                y: this.y,
                radius: 350,
                intensity: 0.4 * this.alpha,
                isAtlantis: true 
            });
            
            const cosR = Math.cos(this.rotation || 0);
            const sinR = Math.sin(this.rotation || 0);
            const crystalX = this.x + (this.crystalOffsetX * cosR - this.crystalOffsetY * sinR);
            const crystalY = this.y + (this.crystalOffsetX * sinR + this.crystalOffsetY * cosR);
            
            sources.push({
                x: crystalX,
                y: crystalY,
                radius: 250, 
                intensity: 0.9 * this.alpha,
                isCursedCrystal: true 
            });
        }

        this.myProjectiles.forEach(p => {
            if (p.getLightSources) sources.push(...p.getLightSources());
        });

        return sources;
    }

    draw(ctx, assets) {
        // Отрисовка Кракена (пока он виден)
        if (this.krakenInstance && this.krakenInstance.alpha > 0) {
            this.krakenInstance.draw(ctx, assets);
        }
        this.myProjectiles.forEach(p => p.draw(ctx, assets));
        this.renderer.draw(ctx, assets);
    }
}