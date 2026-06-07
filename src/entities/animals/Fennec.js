// src/entities/animals/Fennec.js
import { Mob } from "../mobs/Mob.js";
import { assets } from "../../core/Braw.js";
import { audioManager } from "../../core/AudioManager.js";

// Глобальная статическая переменная для контроля "шума" во всем мире.
// Хранит timestamp последнего воспроизведенного звука фенька.
let lastGlobalFennecSoundTime = 0;

export class Fennec extends Mob {
    constructor(x, y) {
        super(x, y);
        
        // Индивидуальные параметры (вариация размеров)
        const sizeScale = Math.random() * 0.4 + 0.8; 
        this.width = Math.floor(32 * sizeScale);
        this.height = Math.floor(24 * sizeScale);
        this.isInDungeon = false;
        
        // Характер: влияет на базовую скорость
        this.personality = Math.random() * 0.8 + 0.6; 
        this.baseSpeed = 1.5 * this.personality;
        this.speed = this.baseSpeed;
        
        // Расширенное дерево состояний
        this.states = { 
            IDLE: 'idle', 
            WALK: 'walk', 
            RUN: 'run', 
            JUMP: 'jump', 
            SLEEP: 'sleep',
            PLAY: 'play' 
        };
        this.currentState = this.states.IDLE;
        this.stateTimer = Math.random() * 100 + 50;
        
        this.direction = Math.random() < 0.5 ? 1 : -1;
        
        // Увеличили базовые таймеры, чтобы звуки были значительно реже
        this.soundTimer = Math.random() * 600 + 400; // Раз в 7-15 секунд
        this.snoreTimer = Math.random() * 400 + 300; // Урчание во сне тоже реже
        this.playVoiceCooldown = 0; // Локальный кулдаун голоса для режима игры

        this.playTarget = null;

        console.log(`%c[Fennec] Создан живой фенёк! Скорость: ${this.baseSpeed.toFixed(1)}, Размер: ${Math.floor(sizeScale * 100)}%`, "color: #ff9f43; font-weight: bold;");
    }

    update(dt, player, allAnimals) {
        super.update(dt, player, allAnimals);

        if (this.isDead) return;

        this.stateTimer--;
        this.soundTimer--;
        if (this.playVoiceCooldown > 0) this.playVoiceCooldown--;

        // Логика смены состояний
        if (this.stateTimer <= 0) {
            this.chooseNewState(allAnimals);
        }

        // Обработка звуков в зависимости от состояния
        if (this.currentState === this.states.SLEEP) {
            this.snoreTimer--;
            if (this.snoreTimer <= 0) {
                this.purrInSleep();
            }
        } else if (this.currentState !== this.states.PLAY) {
            // В обычном состоянии проверяем таймер
            if (this.soundTimer <= 0) {
                this.makeSound();
            }
        }

        // Поведение ИИ
        switch (this.currentState) {
            case this.states.WALK:
                this.speed = this.baseSpeed;
                this.velocityX = this.direction * this.speed;
                if (Math.abs(this.velocityX) < 0.1 && this.onGround) {
                    this.direction *= -1;
                }
                break;

            case this.states.RUN:
                this.speed = this.baseSpeed * 2.2; 
                this.velocityX = this.direction * this.speed;
                
                if (this.onGround && Math.random() < 0.02) {
                    this.velocityY = -4;
                    this.onGround = false;
                }

                if (Math.abs(this.velocityX) < 0.1 && this.onGround) {
                    this.direction *= -1;
                }
                break;

            case this.states.JUMP:
                if (this.onGround) {
                    this.velocityY = -(Math.random() * 3 + 5); 
                    this.velocityX = this.direction * (this.baseSpeed * 1.5);
                    this.onGround = false;
                }
                if (this.onGround && this.velocityY === 0) {
                    this.currentState = this.states.IDLE;
                }
                break;

            case this.states.PLAY:
                if (!this.playTarget || this.playTarget.markedForDeletion || this.playTarget.currentState === this.states.SLEEP) {
                    this.playTarget = null;
                    this.currentState = this.states.IDLE;
                    this.stateTimer = 20;
                    break;
                }

                const distanceToPartner = this.playTarget.x - this.x;
                this.direction = distanceToPartner > 0 ? 1 : -1;
                
                if (Math.abs(distanceToPartner) > 40) {
                    this.speed = this.baseSpeed * 1.8;
                    this.velocityX = this.direction * this.speed;
                } else {
                    this.velocityX = 0;
                    if (this.onGround && Math.random() < 0.1) {
                        this.velocityY = -5;
                        this.onGround = false;
                        this.direction *= -1; 
                        
                        // ИСПРАВЛЕНО: Звук в игре воспроизводится только если прошел кулдаун
                        // и соблюдено правило глобального лимита шума
                        if (this.playVoiceCooldown <= 0 && Math.random() < 0.2) {
                            if (this.checkGlobalSoundPermission(1500)) { // Не чаще чем раз в 1.5 секунды на игру
                                audioManager.playSFX("mob/meow.wav", 0.12);
                                this.playVoiceCooldown = 120; // Затыкаем конкретно этого фенька на 2 секунды
                            }
                        }
                    }
                }
                break;

            case this.states.SLEEP:
                this.velocityX = 0;
                break;

            case this.states.IDLE:
            default:
                this.velocityX = 0;
                break;
        }
    }

    chooseNewState(allAnimals) {
        const rand = Math.random();

        // Сверили бросок на поиск друга (25% шанс)
        if (rand < 0.25 && allAnimals && allAnimals.length > 1) {
            const potentialFriend = allAnimals.find(animal => 
                animal !== this && 
                animal instanceof Fennec &&
                animal.currentState !== this.states.SLEEP &&
                animal.currentState !== this.states.PLAY &&
                Math.abs(animal.x - this.x) < 400 
            );

            if (potentialFriend) {
                this.currentState = this.states.PLAY;
                this.playTarget = potentialFriend;
                this.stateTimer = Math.random() * 200 + 150; 

                potentialFriend.currentState = this.states.PLAY;
                potentialFriend.playTarget = this;
                potentialFriend.stateTimer = this.stateTimer;
                return;
            }
        }

        const behaviorRand = Math.random();

        if (behaviorRand < 0.35) {
            this.currentState = this.states.WALK;
            this.direction = Math.random() < 0.5 ? 1 : -1;
            this.stateTimer = Math.random() * 150 + 100;
        } else if (behaviorRand < 0.55) {
            this.currentState = this.states.RUN;
            this.direction = Math.random() < 0.5 ? 1 : -1;
            this.stateTimer = Math.random() * 100 + 80;
        } else if (behaviorRand < 0.75) {
            this.currentState = this.states.IDLE;
            this.stateTimer = Math.random() * 100 + 50;
        } else if (behaviorRand < 0.90) {
            this.currentState = this.states.JUMP;
            this.stateTimer = Math.random() * 60 + 30;
        } else {
            this.currentState = this.states.SLEEP;
            this.stateTimer = Math.random() * 400 + 300; 
        }
    }

    // Вспомогательный метод защиты от шума: 
    // Проверяет, не кричал ли какой-либо другой фенёк в мире слишком недавно
    checkGlobalSoundPermission(minIntervalMs = 3000) {
        const now = performance.now();
        if (now - lastGlobalFennecSoundTime < minIntervalMs) {
            return false; // Запрещаем орать, кто-то другой уже шумел
        }
        lastGlobalFennecSoundTime = now;
        return true;
    }

    makeSound() {
        this.soundTimer = Math.random() * 600 + 600; // Сброс таймера на долгое время
        
        // Если глобальный фильтр пропустил звук — играем его
        if (this.checkGlobalSoundPermission(4000)) { // Обычные звуки не чаще раза в 4 секунды на весь биом
            if (Math.random() < 0.6) {
                audioManager.playSFX("mob/meow.wav", 0.18);
            } else {
                audioManager.playSFX("mob/purring-cat.wav", 0.15);
            }
        }
    }

    purrInSleep() {
        this.snoreTimer = Math.random() * 500 + 400; 
        
        // Храп во сне тоже фильтруем, чтобы 3 спящих рядом фенька не превращались в серверную стойку
        if (this.checkGlobalSoundPermission(5000)) {
            audioManager.playSFX("mob/purring-cat.wav", 0.1);
        }
    }

    die() {
        this.isDead = true;
        this.markedForDeletion = true;
    }

    draw(ctx) {
        const img = assets ? assets["fennec"] : null;

        if (img) {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.scale(this.direction, 1);
            
            if (this.currentState === this.states.SLEEP) {
                ctx.rotate(0.1 * this.direction);
                ctx.globalAlpha = 0.75; 
            } else if (this.currentState === this.states.PLAY) {
                ctx.rotate(Math.sin(performance.now() * 0.02) * 0.08);
            }

            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        } else {
            ctx.save();
            if (this.currentState === this.states.SLEEP) {
                ctx.fillStyle = "#d68038";
            } else if (this.currentState === this.states.PLAY) {
                ctx.fillStyle = "#ffb066"; 
            } else {
                ctx.fillStyle = "#ff9f43";
            }
            
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            ctx.fillStyle = "#ffcbd1";
            ctx.fillRect(this.x + (this.direction > 0 ? this.width - 6 : 2), this.y - 6, 4, 6);
            ctx.restore();
        }
    }
}