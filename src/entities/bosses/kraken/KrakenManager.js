// src/entities/bosses/kraken/KrakenManager.js
import { Kraken } from "./Kraken.js";

class KrakenManager {
    constructor() {
        this.kraken = null;
        this.isActive = false;
        this.shipTarget = null;
        this.spawnTimer = 0;
        this.howlTimer = 0;
        this.state = 'idle'; 

        // Координаты смещения для эффекта тряски экрана
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
    }

    prepareSpawn(ship) {
        if (this.isActive || !ship) return;
        this.shipTarget = ship;
        this.isActive = true;
        
        // ФАЗА 1: Включаем вой и яростное дрожание всего вокруг
        this.state = 'howling';
        this.howlTimer = 4.0;       // Длительность воя в секундах (можно подогнать под длину mp3)
        this.shakeIntensity = 8;    // Сила тряски в пикселях

        this.playKrakenHowl();
        console.log("🐙 Из глубин океана раздается ужасающий вой! Все вокруг содрогается...");
    }

    playKrakenHowl() {
        try {
            const howl = new Audio('assets/audio/sfx/boss/kreken/rev_cracken.mp3');
            howl.volume = 0.85;
            howl.play().catch(err => console.log("Аудио не смогло воспроизвестись (нужен клик по экрану):", err));
        } catch (e) {
            console.error("Не удалось запустить файл воя Кракена:", e);
        }
    }

    spawnNow() {
        const centerX = this.shipTarget.x + (this.shipTarget.width / 2 || 0);
        // Спавним глубоко под водой, чтобы он плавно шел вверх
        this.kraken = new Kraken(centerX, this.shipTarget.y + 1200);
        this.kraken.flipX = (this.shipTarget.direction === 1) ? -1 : 1;
        this.state = 'active';
        console.log("🐙 Кракен показался на поверхности и атакует корабль!");
    }

    update(dt) {
        if (!this.isActive) return;

        // ЛОГИКА ФАЗЫ 1: Идет яростный вой, генерируем случайное смещение экрана
        if (this.state === 'howling') {
            this.howlTimer -= dt;
            
            // Быстро меняем случайные смещения в пределах интенсивности
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;

            if (this.howlTimer <= 0) {
                // ПЕРЕХОД К ФАЗЕ 2: Вой закончился, включаем таймер затишья на 10 секунд
                this.state = 'waiting_after_howl';
                this.spawnTimer = 10.0; // Те самые 10 секунд ожидания
                this.shakeX = 0;
                this.shakeY = 0;
                console.log("🐙 Вой стих... Зловещее затишье перед бурей на 10 секунд.");
            }
            return; // Задерживаем выполнение основного кода
        }

        // ЛОГИКА ФАЗЫ 2: Тикают 10 секунд перед появлением туши
        if (this.state === 'waiting_after_howl') {
            this.spawnTimer -= dt;
            
            // Опционально: оставляем легкую, едва заметную вибрацию воды (гул глубин)
            this.shakeX = (Math.random() - 0.5) * 1.5;
            this.shakeY = (Math.random() - 0.5) * 1.5;

            if (this.spawnTimer <= 0) {
                this.shakeX = 0;
                this.shakeY = 0;
                this.spawnNow(); // Спавним и переходим в стейт 'active'
            }
            return;
        }

        // ЛОГИКА ФАЗЫ 3: Кракен активен и в бою
        if (!this.kraken) return;

        // Плавное следование по X за кораблем
        if (this.kraken.state !== 'LEAVING') {
            const dx = this.shipTarget.x - this.kraken.x;
            this.kraken.x += dx * dt * 1.5;
        }

        // Удаляем кракена из памяти при уходе на дно
        if (this.kraken.isDead) {
            this.kraken = null;
            this.isActive = false;
            this.state = 'idle';
            console.log("🐙 Кракен вернулся в бездну.");
            return;
        }

        // Авто-атака
        if (this.kraken.state === 'WAITING' && this.kraken.stateTimer > 2.0) {
            this.kraken.triggerAttack([0, 6, 3]); 
        }

        // Логика подъема на поверхность
        if (this.kraken.state === 'RISING') {
            this.kraken.y -= 150 * dt; 
        }

        this.kraken.update(dt, this.shipTarget);
    }

    draw(ctx, assets) {
        if (this.kraken) {
            this.kraken.draw(ctx, assets);
        }
    }
}

export const krakenManager = new KrakenManager();