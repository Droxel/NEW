// src/world/objects/JungleGuard.js
import { GameState } from "../../core/GameState.js";
import { audioManager } from "../../core/AudioManager.js";

export class JungleGuard {
    constructor(x, y, side) {
        this.x = x;
        this.y = y;
        this.width = 150;
        this.height = 250;
        this.side = side;
        this.alpha = 1.0;
        this.state = 'stone';

        this.lastRoarTime = 0;
        this.roarInterval = Math.random() * 5000 + 10000; 
        this.maxDetectionDistance = 700; 

        // --- НОВОЕ: Ссылка на объект звука гудения ---
        this.buzzingAudio = null;
        this.isBuzzing = false;
    }

    // Вспомогательный метод для инициализации гудения
    initBuzzing() {
        if (this.buzzingAudio) return;
        
        // Создаем аудио объект напрямую, так как нам нужен точный контроль
        this.buzzingAudio = new Audio('./assets/audio/sfx/strikes/buzzing.wav');
        this.buzzingAudio.loop = true;
        this.buzzingAudio.volume = 0;
    }

update(dt, player) { // <-- Добавили dt
    if (this.state === 'destroyed' || !player) {
        this.stopAllSounds();
        return;
    }

        // 1. Проверка на разрушение
        if (GameState.bossesDefeated['jungle_boss'] && this.state === 'stone') {
            this.state = 'crumbling';
            this.stopAllSounds(); 
            // Убрали window.
            if (audioManager) audioManager.playSFX('world/Earthquake.wav', 0.5);
        }

        if (this.state === 'crumbling') {
            this.alpha -= 0.005;
            this.y += 0.4;
            if (this.alpha <= 0) this.state = 'destroyed';
            return;
        }

        // 2. Звуки жизни
        const dist = Math.hypot(player.x - this.x, player.y - this.y);

        if (dist < this.maxDetectionDistance) {
            const volume = (1 - dist / this.maxDetectionDistance) * 0.4;

            // --- ГУДЕНИЕ (Постоянное) ---
            if (!this.buzzingAudio) this.initBuzzing();
            
            if (this.buzzingAudio) {
                if (!this.isBuzzing) {
                    this.isBuzzing = true; // Сначала ставим, что гудим
                    this.buzzingAudio.play().catch(() => {
                        // ИСПРАВЛЕНИЕ: Если браузер запретил воспроизведение - сбрасываем!
                        // В следующем кадре код снова попытается запустить звук.
                        this.isBuzzing = false; 
                    });
                }
                this.buzzingAudio.volume = volume;
            }

            // --- РЫК (Рандомный) ---
            const now = Date.now();
            if (now - this.lastRoarTime > this.roarInterval) {
                // Убрали window.
                if (audioManager && audioManager.playSFX) {
                    audioManager.playSFX('strikes/roar.wav', volume + 0.1);
                }
                this.lastRoarTime = now;
                this.roarInterval = Math.random() * 7000 + 10000; 
            }
        } else {
            this.stopAllSounds();
        }
    }
    stopAllSounds() {
        if (this.buzzingAudio && this.isBuzzing) {
            // Можно сделать резкую остановку:
            this.buzzingAudio.pause();
            this.buzzingAudio.currentTime = 0;
            this.isBuzzing = false;
        }
    }

    draw(ctx, assets) {
        // Твой код отрисовки остается без изменений
        if (this.state === 'destroyed') return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        
        let drawX = this.x - this.width / 2;
        let drawY = this.y - this.height; 

        if (this.state === 'crumbling') {
            drawX += (Math.random() - 0.5) * 6; 
        }

        const img = assets ? assets['jungle_guard'] : null; 

        if (img && img.complete) {
            if (this.side === 'right') {
                ctx.save();
                ctx.translate(drawX + this.width / 2, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(img, -this.width / 2, drawY, this.width, this.height);
                ctx.restore();
            } else {
                ctx.drawImage(img, drawX, drawY, this.width, this.height);
            }
        } else {
            ctx.fillStyle = "#4a4e4d";
            ctx.fillRect(drawX, drawY, this.width, this.height);
        }

        ctx.restore();
    }
}