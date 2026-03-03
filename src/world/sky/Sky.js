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
        this.isNightNow = false;    // Чтобы отслеживать момент начала ночи
        this.isMeteorShower = false; // Включен ли сегодня звездопад

        this.initStars();
        
        // Стартовые облака
        for(let i=0; i<CONFIG.SKY.clouds.countCloudy; i++) {
            this.clouds.push(new Cloud());
        }
    }

    initStars() {
        // Создаем звезды один раз
        for (let i = 0; i < CONFIG.SKY.stars.count; i++) {
            this.stars.push({
                x: Math.random() * CONFIG.width,
                y: Math.random() * (CONFIG.height * 0.65), // Небо
                size: Math.random() * 1.5 + 0.2,
                baseAlpha: Math.random() * 0.8 + 0.2, // Разная яркость
                twinkleSpeed: Math.random() * 0.05 + 0.01
            });
        }
    }

    update(dt, timeObj) {
        const time = timeObj.getNormalized(); // 0.0 ... 1.0

        // 1. ПРОВЕРКА НАЧАЛА НОЧИ И ЗВЕЗДОПАДА
        // Ночь считаем с 0.5 (закат). Проверяем переход с "дня" на "ночь"
        const isNight = time > 0.5 && time < 0.95;
        
        if (isNight && !this.isNightNow) {
            // Ура, наступила ночь! Кидаем кубик на звездопад.
            this.isMeteorShower = Math.random() < CONFIG.SKY.stars.starfallChance;
            if (this.isMeteorShower) console.log("✨ WOW! RARE METEOR SHOWER TONIGHT! ✨");
        }
        this.isNightNow = isNight;
        // Если наступило утро, сбрасываем флаг звездопада
        if (time < 0.2) this.isMeteorShower = false;


        // 2. ПОГОДА
        this.weatherTimer += dt;
        if (this.weatherTimer > 20) { // Каждые 20 сек шанс сменить погоду
            this.weatherTimer = 0;
            // 50/50 шанс смены
            const newWeather = Math.random() > 0.5 ? 'clear' : 'cloudy';
            if (this.weather !== newWeather) {
                this.weather = newWeather;
                console.log("Weather changed to:", this.weather);
            }
        }

        // 3. ОБЛАКА
        // Обновляем существующие
        // filter оставляет только те, где update вернул false (не удалились)
        this.clouds = this.clouds.filter(c => !c.update(dt));

        // Спавн новых облаков ТОЛЬКО если погода 'cloudy'
        if (this.weather === 'cloudy') {
            if (this.clouds.length < CONFIG.SKY.clouds.countCloudy) {
                // Добавляем новое облако слева
                this.clouds.push(new Cloud()); 
            }
        }
        // Если погода 'clear', мы просто НЕ добавляем новые. Старые улетят сами (см. Cloud.js)

        // 4. КОМЕТЫ / ЗВЕЗДОПАД
        // Шанс появления кометы зависит от того, идет ли звездопад
        let currentChance = this.isMeteorShower ? CONFIG.SKY.comets.chanceShower : CONFIG.SKY.comets.chanceNormal;
        
        // Звезды падают только ночью
        if (isNight && Math.random() < currentChance) {
            this.spawnShootingStar();
        }
        this.updateComets(dt);
    }

    spawnShootingStar() {
        const startX = Math.random() * CONFIG.width;
        const startY = Math.random() * (CONFIG.height * 0.3); // Только сверху
        
        this.comets.push({
            x: startX,
            y: startY,
            // Летят аккуратно влево-вниз
            vx: -200 - Math.random() * 100, 
            vy: 100 + Math.random() * 50,
            len: 0, // Длина хвоста (будет расти)
            maxLen: 50 + Math.random() * 50, // Максимальная длина хвоста
            life: 1.0, // Время жизни
            width: 1.5 // Толщина
        });
    }

    updateComets(dt) {
        this.comets.forEach(c => {
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            
            // Хвост растет пока комета новая, потом не меняется
            if (c.len < c.maxLen) c.len += dt * 300;
            
            c.life -= dt * 0.8; // Скорость исчезновения
        });
        // Удаляем умершие
        this.comets = this.comets.filter(c => c.life > 0);
    }

    // --- ОТРИСОВКА ---

    draw(ctx, timeObj) {
        const time = timeObj.getNormalized();
        
        // 1. Фон (Градиент неба)
        this.drawSkyGradient(ctx, time);

        // 2. Звезды (Только ночью)
        // Вычисляем прозрачность звезд:
        // 0.4(вечер) -> 0, 0.5(закат) -> растет, 0.75(полночь) -> 1.0, 1.0(рассвет) -> 0
        let starVisibility = 0;
        if (time > 0.45 && time <= 1.0) {
            // Простая синусоида для плавности
            starVisibility = Math.sin((time - 0.45) * Math.PI * 1.8); 
            if (starVisibility < 0) starVisibility = 0;
        } else if (time < 0.2) {
             // Остаток ночи утром (0.0 -> 0.2)
             starVisibility = 1.0 - (time / 0.2);
        }

        if (starVisibility > 0) {
            this.drawStars(ctx, starVisibility, timeObj.elapsed);
            this.drawComets(ctx);
        }

        // 3. Солнце и Луна
        this.drawCelestialBodies(ctx, time);

        // 4. Облака
        // Вычисляем цвет и "фактор заката" для градиента
        let cloudColor = {r:255, g:255, b:255}; // Днем белые
        let sunFactor = 0; // 0 - нет рыжего, 1 - максимум рыжего

        // Ночь (синеватые)
        if (time > 0.65 || time < 0.15) {
            cloudColor = {r: 160, g: 160, b: 190}; 
        }
        
        // Закат (0.4 - 0.6) или Рассвет (0.9 - 0.1)
        // Определяем "силу" рыжего цвета
        if (time >= 0.4 && time <= 0.6) {
            // Пик заката в 0.5
            sunFactor = 1 - Math.abs(time - 0.5) * 5; 
            if (sunFactor < 0) sunFactor = 0;
            // Цвет самого облака чуть розовеет
            cloudColor = {r: 255, g: 220, b: 220};
        }
        
        this.clouds.forEach(c => c.draw(ctx, cloudColor, sunFactor));
    }

    drawSkyGradient(ctx, t) {
        // Твоя функция градиента из старого кода (она хорошая, оставляем)
        // Я сокращу код здесь для краткости, используй ту же логику lerpC
        const C = CONFIG.SKY.colors;
        let c1, c2, fade;
        // ... (используй свой старый код для расчета c1, c2)
        // Если нужно, я могу продублировать, но там всё ок.
        
        // ВСТАВЬ СЮДА ЛОГИКУ LERP ИЗ СВОЕГО СТАРОГО КОДА
        // Для примера заглушка:
        const lerpC = (a, b, f) => [
             Math.round(a[0] + (b[0] - a[0]) * f),
             Math.round(a[1] + (b[1] - a[1]) * f),
             Math.round(a[2] + (b[2] - a[2]) * f)
        ];
        
        // Упрощенная логика фаз для примера (лучше оставь свою полную)
        if (t < 0.25) { c1 = lerpC(C.dawn.top, C.noon.top, t/0.25); c2 = lerpC(C.dawn.bottom, C.noon.bottom, t/0.25); }
        else if (t < 0.5) { c1 = lerpC(C.noon.top, C.dusk.top, (t-0.25)/0.25); c2 = lerpC(C.noon.bottom, C.dusk.bottom, (t-0.25)/0.25); }
        else if (t < 0.75) { c1 = lerpC(C.dusk.top, C.midnight.top, (t-0.5)/0.25); c2 = lerpC(C.dusk.bottom, C.midnight.bottom, (t-0.5)/0.25); }
        else { c1 = lerpC(C.midnight.top, C.dawn.top, (t-0.75)/0.25); c2 = lerpC(C.midnight.bottom, C.dawn.bottom, (t-0.75)/0.25); }

        const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
        grad.addColorStop(0, `rgb(${c1.join(',')})`);
        grad.addColorStop(1, `rgb(${c2.join(',')})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
    }

    drawStars(ctx, alpha, totalTime) {
        ctx.fillStyle = "white";
        this.stars.forEach(s => {
            // Мерцание
            const twinkle = Math.sin(totalTime * s.twinkleSpeed * 5) * 0.5 + 0.5; 
            ctx.globalAlpha = alpha * s.baseAlpha * twinkle;
            
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    drawComets(ctx) {
        // Рисуем аккуратные "иголочки" с градиентом прозрачности
        this.comets.forEach(c => {
            // Вычисляем конец хвоста (где он был раньше)
            // Нормализуем вектор скорости для направления
            const speed = Math.sqrt(c.vx*c.vx + c.vy*c.vy);
            const nx = c.vx / speed;
            const ny = c.vy / speed;

            // Координаты хвоста
            const tailX = c.x - nx * c.len;
            const tailY = c.y - ny * c.len;

            // Создаем градиент для хвоста: Голова (белая) -> Хвост (прозрачный)
            const grad = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
            grad.addColorStop(0, `rgba(255, 255, 255, ${c.life})`);
            grad.addColorStop(1, "rgba(255, 255, 255, 0)");

            ctx.strokeStyle = grad;
            ctx.lineWidth = c.width;
            ctx.lineCap = "round"; // Закругленные края

            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
        });
    }

    drawCelestialBodies(ctx, t) {
         // (Оставляем твой код для солнца и луны без изменений, он норм)
         // ... (сюда вставь drawCelestialBodies из прошлого кода)
         
         // Единственное, добавь сохранение контекста в начале и конце
         const cx = CONFIG.width / 2;
         const cy = CONFIG.height;
         const radius = CONFIG.width * 0.4;
         
         ctx.save();
         if (t < 0.5) {
             // СОЛНЦЕ
             const sunT = t / 0.5;
             const angle = Math.PI + (sunT * Math.PI);
             const x = cx + Math.cos(angle) * radius;
             const y = cy + Math.sin(angle) * radius * 0.9;
             
             ctx.shadowBlur = 40;
             ctx.shadowColor = "rgba(255, 255, 100, 0.8)";
             ctx.fillStyle = "#FFDD00";
             ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI*2); ctx.fill();
         } else {
// ЛУНА С КРАТЕРАМИ
            const moonT = (t - 0.5) / 0.5;
            const angle = Math.PI + (moonT * Math.PI);
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius * 0.8;

            // Сама Луна
            ctx.shadowBlur = 15; ctx.shadowColor = "#aaf";
            ctx.fillStyle = "#EEE";
            ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI*2); ctx.fill();
            
            // Рисуем кратеры (аккуратные пятнышки)
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(180, 180, 200, 0.6)";
            
            // Позиции кратеров относительно центра Луны
            const craters = [
                { dx: -8, dy: -5, r: 5 },
                { dx: 10, dy: 8, r: 3 },
                { dx: 2, dy: 12, r: 4 },
                { dx: -12, dy: 10, r: 2 }
            ];
            
            craters.forEach(c => {
                ctx.beginPath();
                ctx.arc(x + c.dx, y + c.dy, c.r, 0, Math.PI*2);
                ctx.fill();
            });
        }
        ctx.restore();
    }
}