// src/world/Weather.js
import { CONFIG } from "../../data/config.js";
import { audioManager } from "../../core/AudioManager.js"; // Подключаем твой аудиоменеджер

export class WeatherManager {
    constructor() {
        this.currentWeather = 'clear'; // 'clear' или 'storm'
        this.intensity = 0;            // 0 = ясно, 1 = полный шторм
        this.transitionSpeed = 0.15;   // Чуть помедленнее нарастание для атмосферы (~6-7 сек)
        
        // Логика молний
        this.lightningTimer = 0;
        this.isLightningFlash = false;
        this.flashAlpha = 0;
        this.activeBolts = [];         // Массив текущих отрисовываемых молний
    }

    setTargetWeather(type) {
        this.currentWeather = type;
    }

    update(dt) {
        // Плавно меняем интенсивность шторма
        if (this.currentWeather === 'storm') {
            this.intensity = Math.min(1, this.intensity + this.transitionSpeed * dt);
        } else {
            this.intensity = Math.max(0, this.intensity - this.transitionSpeed * dt);
        }

        if (this.intensity <= 0.4) {
            this.isLightningFlash = false;
            this.activeBolts = [];
            return;
        }

        // Таймер следующего удара (интервал 5-12 секунд при полном шторме)
        this.lightningTimer -= dt;
        if (this.lightningTimer <= 0) {
            // Чем сильнее шторм, тем чаще молнии
            this.lightningTimer = (6 + Math.random() * 6) / this.intensity; 
            this.triggerLightning();
        }

        // Затухание вспышки экрана
        if (this.isLightningFlash) {
            this.flashAlpha -= dt * 4; // Быстрое затухание вспышки
            if (this.flashAlpha <= 0) {
                this.isLightningFlash = false;
                this.activeBolts = []; // Гасим саму молнию вместе со вспышкой
            }
        }
    }

    /**
     * Запуск генерации молнии и звука
     */
    triggerLightning() {
        this.isLightningFlash = true;
        this.flashAlpha = 0.5 + Math.random() * 0.4; // Случайная яркость вспышки
        
        // Генерируем 1-2 ветки молний
        this.activeBolts = [];
        const numBolts = Math.random() > 0.6 ? 2 : 1;
        
        for (let i = 0; i < numBolts; i++) {
            // Выбираем случайную точку старта в верхней части экрана (где облака)
            const startX = Math.random() * CONFIG.width;
            const startY = Math.random() * (CONFIG.height * 0.25);
            this.activeBolts.push(this.generateLightningPath(startX, startY));
        }

        // АТМОСФЕРА: Воспроизведение звука грома из твоих ассетов
        if (audioManager && typeof audioManager.playSFX === 'function') {
            const track = Math.random() > 0.5 ? 'world/sky/thunder_1.mp3' : 'world/sky/thunder_2.mp3';
            audioManager.playSFX(track);
        }
    }

    /**
     * Процедурная генерация ломаной линии молнии (алгоритм Midpoint Displacement)
     */
    generateLightningPath(startX, startY) {
        const segments = [];
        let curX = startX;
        let curY = startY;
        
        // Направление удара — вниз, к линии горизонта земли/океана
        const targetY = CONFIG.height * (0.5 + Math.random() * 0.25); 
        const steps = 15 + ((Math.random() * 10) | 0);
        const stepY = (targetY - startY) / steps;

        segments.push({ x: curX, y: curY });

        for (let i = 0; i < steps; i++) {
            curY += stepY;
            // Делаем зигзаги по оси X. Чем ниже, тем слабее может быть отклонение
            curX += (Math.random() - 0.5) * 55; 
            segments.push({ x: curX, y: curY });

            // Шанс ответвления маленькой побочной веточки молнии
            if (Math.random() < 0.12 && i < steps - 4) {
                this.generateSubBranch(curX, curY, stepY, steps - i);
            }
        }
        return { main: segments, alpha: 1.0 };
    }

    generateSubBranch(startX, startY, stepY, remainingSteps) {
        const segments = [{ x: startX, y: startY }];
        let curX = startX;
        let curY = startY;
        const branchLength = (remainingSteps * 0.6) | 0;
        
        // Наклон в сторону
        const dirSign = Math.random() > 0.5 ? 1 : -1;

        for (let i = 0; i < branchLength; i++) {
            curY += stepY * 0.8;
            curX += (Math.random() * 40) * dirSign;
            segments.push({ x: curX, y: curY });
        }
        
        this.activeBolts.push({ main: segments, isBranch: true });
    }

    /**
     * Рисуется СРАЗУ после базового неба, но ДО земли, корабля
     */
drawSkyOverlay(ctx) {
        if (this.intensity <= 0) return;

        ctx.save();
        
        // 1. Накладываем плотный грозовой полумрак
        const stormGrad = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
        
        // ИСПРАВЛЕНИЕ: Поднимаем альфу до 0.98 на вершине, чтобы старое небо полностью блокировалось
        stormGrad.addColorStop(0, `rgba(8, 10, 18, ${this.intensity * 0.98})`);
        stormGrad.addColorStop(0.5, `rgba(18, 20, 32, ${this.intensity * 0.92})`);
        stormGrad.addColorStop(1, `rgba(30, 25, 40, ${this.intensity * 0.5})`);
        
        ctx.fillStyle = stormGrad;
        ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

        // 2. Отрисовка самих разрядов молний
        if (this.activeBolts.length > 0) {
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            this.activeBolts.forEach(bolt => {
                ctx.beginPath();
                ctx.moveTo(bolt.main[0].x, bolt.main[0].y);
                
                for (let i = 1; i < bolt.main.length; i++) {
                    ctx.lineTo(bolt.main[i].x, bolt.main[i].y);
                }

                if (!bolt.isBranch) {
                    ctx.shadowBlur = 25;
                    ctx.shadowColor = "rgba(180, 210, 255, 1)";
                    ctx.strokeStyle = "rgba(255, 255, 255, 1)";
                    ctx.lineWidth = 3 + Math.random() * 2; 
                } else {
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = "rgba(160, 200, 255, 0.8)";
                    ctx.strokeStyle = "rgba(200, 225, 255, 0.8)";
                    ctx.lineWidth = 1.5;
                }
                ctx.stroke();
            });

            ctx.shadowBlur = 0;
        }

        // 3. Атмосферная вспышка по всему экрану
        if (this.isLightningFlash && this.flashAlpha > 0) {
            const flicker = Math.random() > 0.3 ? this.flashAlpha : this.flashAlpha * 0.5;
            ctx.fillStyle = `rgba(235, 245, 255, ${flicker * this.intensity * 0.65})`;
            ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
        }

        ctx.restore();
    }
}

export const weatherManager = new WeatherManager();