/* src/world/sky/Cloud.js */
import { CONFIG } from "../../core/config.js";

export class Cloud {
    constructor() {
        // Создаем персональный буфер (кэш) для облака
        this.cacheCanvas = document.createElement('canvas');
        this.cacheCtx = this.cacheCanvas.getContext('2d');
        
        this.reset(true);
        this.currentColor = { r: 255, g: 255, b: 255 };
        this.lastSunFactor = -1; // Чтобы знать, когда перерисовать градиент
    }

    reset(randomX = false) {
        this.size = 30 + Math.random() * 40;
        this.speed = 15 + Math.random() * 20;
        this.x = randomX ? Math.random() * CONFIG.width : -this.size * 4;
        this.y = Math.random() * (CONFIG.height * 0.4);
        this.opacity = 0;
        this.targetOpacity = 0.5 + Math.random() * 0.3;

        // Подгоняем размер кэш-холста под размер облака (с запасом на "пачку" кругов)
        const bufferSize = this.size * 4;
        this.cacheCanvas.width = bufferSize;
        this.cacheCanvas.height = bufferSize;
        this.lastSunFactor = -1; // Сбрасываем кэш при ресете
    }

    update(dt) {
        this.x += this.speed * dt;
        if (this.opacity < this.targetOpacity) this.opacity += dt * 0.5;
        // Если облако улетело за экран, возвращаем true для удаления/ресета
        return this.x > CONFIG.width + this.size * 3;
    }

    // Метод, который рисует облако в кэш ОДИН РАЗ (или при смене цвета)
    redrawCache(sunFactor) {
        const ctx = this.cacheCtx;
        const sz = this.size;
        const center = this.cacheCanvas.width / 2;
        
        ctx.clearRect(0, 0, this.cacheCanvas.width, this.cacheCanvas.height);

        const lerp = (a, b, f) => a + (b - a) * f;
        
        // Функция для рисования пузырька относительно центра холста
        const drawBubble = (ox, oy, bubbleSz) => {
            // Градиент теперь рисуется локально внутри маленького холста
            const grad = ctx.createLinearGradient(center + ox, center + oy - bubbleSz, center + ox, center + oy + bubbleSz);
            
            const topColor = `rgb(${Math.round(this.currentColor.r)}, ${Math.round(this.currentColor.g)}, ${Math.round(this.currentColor.b)})`;
            
            const glow = CONFIG.SKY.clouds.sunsetGlow;
            const rBot = lerp(this.currentColor.r, glow.r, sunFactor);
            const gBot = lerp(this.currentColor.g, glow.g, sunFactor);
            const bBot = lerp(this.currentColor.b, glow.b, sunFactor);
            const botColor = `rgb(${Math.round(rBot)}, ${Math.round(gBot)}, ${Math.round(bBot)})`;

            grad.addColorStop(0, topColor);
            grad.addColorStop(1, botColor);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(center + ox, center + oy, bubbleSz, 0, Math.PI * 2);
            ctx.fill();
        };

        // Рисуем структуру облака в кэш
        drawBubble(0, 0, sz);
        drawBubble(-sz * 0.5, sz * 0.1, sz * 0.7);
        drawBubble(sz * 0.6, sz * 0.2, sz * 0.6);
        drawBubble(sz * 0.2, -sz * 0.4, sz * 0.5);
        
        this.lastSunFactor = Math.round(sunFactor * 100); // Запоминаем состояние (точность до 1%)
    }

    draw(ctx, targetBaseColor, sunFactor) {
        const lerp = (a, b, f) => a + (b - a) * f;
        
        // Плавно меняем цвет
        this.currentColor.r = lerp(this.currentColor.r, targetBaseColor.r, 0.05);
        this.currentColor.g = lerp(this.currentColor.g, targetBaseColor.g, 0.05);
        this.currentColor.b = lerp(this.currentColor.b, targetBaseColor.b, 0.05);

        // ПРОВЕРКА: Нужно ли перерисовывать кэш?
        // Мы перерисовываем только если sunFactor заметно изменился (закат/рассвет)
        const currentSunKey = Math.round(sunFactor * 100);
        if (this.lastSunFactor !== currentSunKey) {
            this.redrawCache(sunFactor);
        }

        // Отрисовка готовой картинки из кэша
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // Рисуем облако, центрируя его по координатам x, y
        const offset = this.cacheCanvas.width / 2;
        ctx.drawImage(this.cacheCanvas, this.x - offset, this.y - offset);
        
        ctx.restore();
    }
}