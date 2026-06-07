// src/world/CorruptionManager.js
import { GameState } from "../core/GameState.js";
import { world } from "./World.js";
import { cameraX } from "../core/Braw.js"; // Нам нужна камера, чтобы спавнить ЗА ней
import { CONFIG } from "../data/config.js";

export class CorruptionManager {
    constructor() {
        this.spots = []; 
        this.spawnTimer = 0;
        this.visualAlpha = 0; // Текущая прозрачность (плавная)
    }

    // Вызывается каждый кадр в основном цикле игры (добавишь в World.update или Main)
update(dt) {
        const level = GameState.corruptionLevel;
        
        // --- ПЛАВНОЕ ЗАТЕМНЕНИЕ ---
        // Рассчитываем целевую прозрачность
        let targetAlpha = 0;
        if (level === 1) targetAlpha = 0.25;
        if (level === 2) targetAlpha = 0.45;
        if (level >= 3) targetAlpha = 0.65;

        // Очень медленно приближаем visualAlpha к targetAlpha
        // 0.01 значит, что экран будет темнеть несколько минут
        if (this.visualAlpha < targetAlpha) {
            this.visualAlpha += 0.0001; 
        }

        if (level === 0) return;

        this.spawnTimer += dt; // Используем dt для стабильности
        const spawnDelay = level === 1 ? 10 : (level === 2 ? 5 : 2); // Секунды

        if (this.spawnTimer > spawnDelay) {
            this.spawnTimer = 0;
            this.trySpawnSpotOffscreen(level);
        }
    }
    trySpawnSpotOffscreen(level) {
        // Ограничение по количеству, чтобы не убить ФПС
        const maxSpots = level * 80;
        if (this.spots.length >= maxSpots) return;

        // Выбираем сторону: лево или право за границами экрана
        const dir = Math.random() > 0.5 ? 1 : -1;
        const offset = 1000 + Math.random() * 2000; // От 1000 до 3000 пикселей от игрока
        const x = cameraX + (CONFIG.width / 2) + (dir * offset);
        
        const y = world.getHeight(x);
        
        if (!isNaN(y)) {
            this.spots.push({
                x: x,
                y: y + (Math.random() * 50 - 25), // Немного рандома по высоте
                radius: Math.random() * (level * 15) + 10,
                color: "#130011"
            });
        }
    }

    // Этот метод теперь можно вызывать при убийстве босса просто для эффекта, 
    // но основная работа идет в update()
    spreadCorruption(bossKey) {
        console.log(`😈 Зло начинает медленно расползаться... Уровень: ${GameState.corruptionLevel}`);
    }

draw(ctx, leftView, rightView) {
        if (this.visualAlpha <= 0) return;

        ctx.save();
        for (let i = 0; i < this.spots.length; i++) {
            const spot = this.spots[i];
            if (spot.x > leftView - spot.radius && spot.x < rightView + spot.radius) {
                ctx.beginPath();
                ctx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2);
                ctx.fillStyle = spot.color;
                // Чуть пульсируем пятнами для жуткости
                const pulse = Math.sin(Date.now() / 500 + spot.x) * 0.2;
                ctx.globalAlpha = 0.6 + pulse; 
                ctx.fill();
            }
        }
        ctx.restore();

        // Фон неба при порче
ctx.save();
        ctx.fillStyle = `rgba(19, 0, 17, ${this.visualAlpha})`; 
        ctx.fillRect(leftView, -5000, rightView - leftView, 10000);
        ctx.restore();
    }
}
