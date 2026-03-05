/* src/world/sky/Sky.js */
import { CONFIG } from "../../core/config.js";
import { Cloud } from "./Cloud.js";

export class Sky {
    constructor() {
        this.clouds = [];
        this.stars = [];
        this.comets = [];
        
        this.weather = 'cloudy'; // Начинаем с облаков
        this.weatherTimer = 0;
        
        // Логика звездопада
        this.isNightNow = false;    
        this.isMeteorShower = false;

        this.initStars();
        this.initCelestialCache(); // ОПТИМИЗАЦИЯ: Кешируем Солнце и Луну
        
        // Стартовые облака
        for(let i=0; i<CONFIG.SKY.clouds.countCloudy; i++) {
            this.clouds.push(new Cloud());
        }
    }

    // ОПТИМИЗАЦИЯ: Рисуем Солнце и Луну на невидимые холсты один раз!
    initCelestialCache() {
        // Кеш Солнца (размер с запасом под свечение 40)
        this.sunCache = document.createElement('canvas');
        this.sunCache.width = 150;
        this.sunCache.height = 150;
        const sunCtx = this.sunCache.getContext('2d');
        sunCtx.shadowBlur = 40;
        sunCtx.shadowColor = "rgba(255, 255, 100, 0.8)";
        sunCtx.fillStyle = "#FFDD00";
        sunCtx.beginPath(); 
        sunCtx.arc(75, 75, 20, 0, Math.PI*2); 
        sunCtx.fill();

        // Кеш Луны (размер с запасом под свечение 15)
        this.moonCache = document.createElement('canvas');
        this.moonCache.width = 100;
        this.moonCache.height = 100;
        const moonCtx = this.moonCache.getContext('2d');
        moonCtx.shadowBlur = 15; 
        moonCtx.shadowColor = "#aaf";
        moonCtx.fillStyle = "#EEE";
        moonCtx.beginPath(); 
        moonCtx.arc(50, 50, 25, 0, Math.PI*2); 
        moonCtx.fill();
        
        // Кратеры Луны (без размытия, рисуем поверх)
        moonCtx.shadowBlur = 0;
        moonCtx.fillStyle = "rgba(180, 180, 200, 0.6)";
        const craters = [
            { dx: -8, dy: -5, r: 5 }, { dx: 10, dy: 8, r: 3 },
            { dx: 2, dy: 12, r: 4 }, { dx: -12, dy: 10, r: 2 }
        ];
        craters.forEach(c => {
            moonCtx.beginPath();
            moonCtx.arc(50 + c.dx, 50 + c.dy, c.r, 0, Math.PI*2);
            moonCtx.fill();
        });
    }

    initStars() {
        for (let i = 0; i < CONFIG.SKY.stars.count; i++) {
            this.stars.push({
                x: (Math.random() * CONFIG.width) | 0,
                y: (Math.random() * (CONFIG.height * 0.65)) | 0,
                size: Math.random() * 1.5 + 0.5,
                baseAlpha: Math.random() * 0.8 + 0.2, 
                twinkleSpeed: Math.random() * 0.05 + 0.01
            });
        }
    }

    update(dt, timeObj) {
        const time = timeObj.getNormalized(); 

        const isNight = time > 0.5 && time < 0.95;
        
        if (isNight && !this.isNightNow) {
            this.isMeteorShower = Math.random() < CONFIG.SKY.stars.starfallChance;
            if (this.isMeteorShower) console.log("✨ WOW! RARE METEOR SHOWER TONIGHT! ✨");
        }
        this.isNightNow = isNight;
        if (time < 0.2) this.isMeteorShower = false;

        this.weatherTimer += dt;
        if (this.weatherTimer > 20) { 
            this.weatherTimer = 0;
            const newWeather = Math.random() > 0.5 ? 'clear' : 'cloudy';
            if (this.weather !== newWeather) {
                this.weather = newWeather;
            }
        }

        this.clouds = this.clouds.filter(c => !c.update(dt));

        if (this.weather === 'cloudy' && this.clouds.length < CONFIG.SKY.clouds.countCloudy) {
            this.clouds.push(new Cloud()); 
        }

        let currentChance = this.isMeteorShower ? CONFIG.SKY.comets.chanceShower : CONFIG.SKY.comets.chanceNormal;
        
        if (isNight && Math.random() < currentChance) {
            this.spawnShootingStar();
        }
        this.updateComets(dt);
    }

    spawnShootingStar() {
        this.comets.push({
            x: Math.random() * CONFIG.width,
            y: Math.random() * (CONFIG.height * 0.3),
            vx: -200 - Math.random() * 100, 
            vy: 100 + Math.random() * 50,
            len: 0, 
            maxLen: 50 + Math.random() * 50,
            life: 1.0, 
            width: 1.5 
        });
    }

    updateComets(dt) {
        for (let i = this.comets.length - 1; i >= 0; i--) {
            let c = this.comets[i];
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            if (c.len < c.maxLen) c.len += dt * 300;
            c.life -= dt * 0.8;
            if (c.life <= 0) this.comets.splice(i, 1);
        }
    }

    draw(ctx, timeObj) {
        const time = timeObj.getNormalized();
        
        this.drawSkyGradient(ctx, time);

        let starVisibility = 0;
        if (time > 0.45 && time <= 1.0) {
            starVisibility = Math.sin((time - 0.45) * Math.PI * 1.8); 
            if (starVisibility < 0) starVisibility = 0;
        } else if (time < 0.2) {
             starVisibility = 1.0 - (time / 0.2);
        }

        if (starVisibility > 0) {
            this.drawStars(ctx, starVisibility, timeObj.elapsed);
            if (this.comets.length > 0) this.drawComets(ctx);
        }

        this.drawCelestialBodies(ctx, time);

        let cloudColor = {r:255, g:255, b:255}; 
        let sunFactor = 0; 

        if (time > 0.65 || time < 0.15) {
            cloudColor = {r: 160, g: 160, b: 190}; 
        }
        
        if (time >= 0.4 && time <= 0.6) {
            sunFactor = 1 - Math.abs(time - 0.5) * 5; 
            if (sunFactor < 0) sunFactor = 0;
            cloudColor = {r: 255, g: 220, b: 220};
        }
        
        for (let i = 0; i < this.clouds.length; i++) {
            this.clouds[i].draw(ctx, cloudColor, sunFactor);
        }
    }

    drawSkyGradient(ctx, t) {
        const C = CONFIG.SKY.colors;
        let c1, c2;
        
        const lerpC = (a, b, f) => [
             (a[0] + (b[0] - a[0]) * f) | 0,
             (a[1] + (b[1] - a[1]) * f) | 0,
             (a[2] + (b[2] - a[2]) * f) | 0
        ];
        
        if (t < 0.25) { c1 = lerpC(C.dawn.top, C.noon.top, t/0.25); c2 = lerpC(C.dawn.bottom, C.noon.bottom, t/0.25); }
        else if (t < 0.5) { c1 = lerpC(C.noon.top, C.dusk.top, (t-0.25)/0.25); c2 = lerpC(C.noon.bottom, C.dusk.bottom, (t-0.25)/0.25); }
        else if (t < 0.75) { c1 = lerpC(C.dusk.top, C.midnight.top, (t-0.5)/0.25); c2 = lerpC(C.dusk.bottom, C.midnight.bottom, (t-0.5)/0.25); }
        else { c1 = lerpC(C.midnight.top, C.dawn.top, (t-0.75)/0.25); c2 = lerpC(C.midnight.bottom, C.dawn.bottom, (t-0.75)/0.25); }

        const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
        grad.addColorStop(0, `rgb(${c1[0]},${c1[1]},${c1[2]})`);
        grad.addColorStop(1, `rgb(${c2[0]},${c2[1]},${c2[2]})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
    }

    drawStars(ctx, alpha, totalTime) {
        ctx.fillStyle = "#FFFFFF";
        for (let i = 0; i < this.stars.length; i++) {
            const s = this.stars[i];
            const twinkle = Math.sin(totalTime * s.twinkleSpeed * 5) * 0.5 + 0.5; 
            ctx.globalAlpha = alpha * s.baseAlpha * twinkle;
            
            // ОПТИМИЗАЦИЯ: fillRect работает в разы быстрее, чем arc!
            // Размер умножаем на 2, чтобы соответствовало диаметру круга
            const d = s.size * 2;
            ctx.fillRect(s.x, s.y, d, d);
        }
        ctx.globalAlpha = 1.0;
    }

    drawComets(ctx) {
        for (let i = 0; i < this.comets.length; i++) {
            const c = this.comets[i];
            const speed = Math.sqrt(c.vx*c.vx + c.vy*c.vy);
            const nx = c.vx / speed;
            const ny = c.vy / speed;

            const tailX = c.x - nx * c.len;
            const tailY = c.y - ny * c.len;

            const grad = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
            grad.addColorStop(0, `rgba(255, 255, 255, ${c.life})`);
            grad.addColorStop(1, "rgba(255, 255, 255, 0)");

            ctx.strokeStyle = grad;
            ctx.lineWidth = c.width;
            ctx.lineCap = "round";

            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
        }
    }

    drawCelestialBodies(ctx, t) {
         const cx = CONFIG.width / 2;
         const cy = CONFIG.height;
         const radius = CONFIG.width * 0.4;
         
         if (t < 0.5) {
             const sunT = t / 0.5;
             const angle = Math.PI + (sunT * Math.PI);
             const x = cx + Math.cos(angle) * radius;
             const y = cy + Math.sin(angle) * radius * 0.9;
             
             // ОПТИМИЗАЦИЯ: Просто рисуем заранее закешированную картинку Солнца (отнимаем половину ширины холста)
             ctx.drawImage(this.sunCache, x - 75, y - 75);
         } else {
            const moonT = (t - 0.5) / 0.5;
            const angle = Math.PI + (moonT * Math.PI);
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius * 0.8;

             // ОПТИМИЗАЦИЯ: Просто рисуем заранее закешированную картинку Луны (отнимаем половину ширины холста)
            ctx.drawImage(this.moonCache, x - 50, y - 50);
        }
    }
}