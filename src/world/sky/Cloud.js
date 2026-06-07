import { CONFIG } from "../../data/config.js";

export class Cloud {
    constructor(randomX = false, stormIntensity = 0) {
        this.cacheCanvas = document.createElement('canvas');
        this.cacheCtx = this.cacheCanvas.getContext('2d');
        
        this.currentColor = { r: 255, g: 255, b: 255 };
        this.lastSunFactor = -1;
        this.reset(randomX, stormIntensity);
    }

reset(randomX = false, stormIntensity = 0) {
    this.isStormCloud = stormIntensity > 0.3 && Math.random() * stormIntensity > 0.15;
    
    const sizeMultiplier = this.isStormCloud ? (2.0 + Math.random() * 1.5) : 1.0;
    this.size = (30 + Math.random() * 40) * sizeMultiplier;
    
    this.speed = (15 + Math.random() * 20) * (this.isStormCloud ? 0.4 : 1.0);
    
    // ВАЖНО: Сначала считаем размеры буфера!
    const bufferWidth = (this.size * (this.isStormCloud ? 6 : 4)) | 0;
    const bufferHeight = (this.size * (this.isStormCloud ? 4 : 4)) | 0;
    
    this.cacheCanvas.width = bufferWidth;
    this.cacheCanvas.height = bufferHeight;

    // Исправлено: спавним ровно за экраном с учетом его половины ширины (offsetX)
    const offsetX = bufferWidth >> 1;
    this.x = randomX ? Math.random() * CONFIG.width : -offsetX;
    
    this.y = this.isStormCloud 
        ? (CONFIG.height * 0.05) + Math.random() * (CONFIG.height * 0.4)
        : Math.random() * (CONFIG.height * 0.4);
        
    this.opacity = 0;
    this.targetOpacity = this.isStormCloud ? (0.8 + Math.random() * 0.2) : (0.5 + Math.random() * 0.3);
    this.lastSunFactor = -1; 
}

    update(dt) {
        this.x += this.speed * dt;
        if (this.opacity < this.targetOpacity) this.opacity += dt * 0.5;
        
        // Корректный уход за экран с учетом увеличенной ширины буфера
        return this.x > CONFIG.width + this.cacheCanvas.width;
    }

    redrawCache(sunFactor) {
        const ctx = this.cacheCtx;
        const sz = this.size;
        const centerX = this.cacheCanvas.width >> 1;
        const centerY = this.cacheCanvas.height >> 1;
        
        ctx.clearRect(0, 0, this.cacheCanvas.width, this.cacheCanvas.height);

        const lerp = (a, b, f) => a + (b - a) * f;
        
        const drawBubble = (ox, oy, bubbleSz) => {
            const cx = centerX + ox;
            const cy = centerY + oy;
            const grad = ctx.createLinearGradient(cx, cy - bubbleSz, cx, cy + bubbleSz);
            
            const topColor = `rgb(${this.currentColor.r | 0}, ${this.currentColor.g | 0}, ${this.currentColor.b | 0})`;
            const glow = CONFIG.SKY.clouds.sunsetGlow;
            const botColor = `rgb(${lerp(this.currentColor.r, glow.r, sunFactor) | 0}, ${lerp(this.currentColor.g, glow.g, sunFactor) | 0}, ${lerp(this.currentColor.b, glow.b, sunFactor) | 0})`;

            grad.addColorStop(0, topColor);
            grad.addColorStop(1, botColor);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, bubbleSz, 0, Math.PI * 2);
            ctx.fill();
        };

        if (this.isStormCloud) {
            // Сложная, многослойная кучевая структура грозового облака
            // 1. Широкое и плотное основание фронта (низ)
            drawBubble(-sz * 1.8, sz * 0.2, sz * 0.5);
            drawBubble(-sz * 1.0, sz * 0.1, sz * 0.75);
            drawBubble(0, sz * 0.15, sz * 0.9);
            drawBubble(sz * 1.0, sz * 0.1, sz * 0.75);
            drawBubble(sz * 1.8, sz * 0.2, sz * 0.5);
            
            // 2. Грозные вздымающиеся пики (верх)
            drawBubble(-sz * 0.5, -sz * 0.3, sz * 0.8);
            drawBubble(sz * 0.4, -sz * 0.25, sz * 0.75);
            drawBubble(-sz * 1.2, -sz * 0.1, sz * 0.55);
            drawBubble(sz * 1.1, -sz * 0.1, sz * 0.6);
        } else {
            // Стандартное легкое облако
            drawBubble(0, 0, sz);
            drawBubble(-sz * 0.5, sz * 0.1, sz * 0.7);
            drawBubble(sz * 0.6, sz * 0.2, sz * 0.6);
            drawBubble(sz * 0.2, -sz * 0.4, sz * 0.5);
        }
        
        this.lastSunFactor = (sunFactor * 100) | 0; 
    }

draw(ctx, targetBaseColor, sunFactor) {
    let colorChanged = false;

    // Плавно меняем цвет
    if (Math.abs(this.currentColor.r - targetBaseColor.r) > 1) {
        this.currentColor.r += (targetBaseColor.r - this.currentColor.r) * 0.05;
        this.currentColor.g += (targetBaseColor.g - this.currentColor.g) * 0.05;
        this.currentColor.b += (targetBaseColor.b - this.currentColor.b) * 0.05;
        colorChanged = true; // Фиксируем, что цвет изменился!
    }

    const currentSunKey = (sunFactor * 100) | 0;
    
    // ИСПРАВЛЕНО: Перерисовываем кэш, если изменилось солнце ИЛИ если цвет облака еще меняется
    if (this.lastSunFactor !== currentSunKey || colorChanged) {
        this.redrawCache(sunFactor);
    }

    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = this.opacity;
    
    const offsetX = this.cacheCanvas.width >> 1;
    const offsetY = this.cacheCanvas.height >> 1;
    ctx.drawImage(this.cacheCanvas, (this.x - offsetX) | 0, (this.y - offsetY) | 0);
    
    ctx.globalAlpha = prevAlpha;
}
}