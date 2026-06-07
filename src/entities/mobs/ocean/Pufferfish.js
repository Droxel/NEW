//Pufferfish.js
import { BaseSeaCreature } from "./BaseSeaCreature.js";
import { audioManager } from "../../../core/AudioManager.js";

export class Pufferfish extends BaseSeaCreature {
    constructor(x, y) {
        // Базовый размер 30
        super(x, y, 30, 25); 
        this.imgKey = "fugu_fish";
        
        // Состояния надувания
        this.puffProgress = 0; // 0 — обычная, 1 — полностью надутая
        this.isPuffed = false;
        
        // Настройки "характера"
        this.normalSize = 30;
        this.puffedSize = 55;
        this.inflationSpeed = 0.08; // Скорость надувания
        this.deflationSpeed = 0.03; // Сдувается медленнее (лениво)
        
        // Для живого плавания (синусоидальное покачивание)
        this.bobTimer = Math.random() * Math.PI * 2;
        
        this.targetVx = (Math.random() - 0.5) * 1.5;
        this.targetVy = (Math.random() - 0.5) * 0.8;
    }

    update(dt, player, world) {
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        const detectionRange = 180;

        // 1. Логика изменения состояния
        if (distToPlayer < detectionRange) {
            if (!this.isPuffed) {
                this.isPuffed = true;
                // Воспроизводим звук надувания из папки world/ocean
                audioManager.playSFX('world/ocean/inflations', 0.2);
            }
        } else if (distToPlayer > detectionRange + 50) {
            this.isPuffed = false;
        }

        // 2. Плавная анимация надувания (Lerp)
        const targetProgress = this.isPuffed ? 1 : 0;
        const step = this.isPuffed ? this.inflationSpeed : this.deflationSpeed;
        this.puffProgress += (targetProgress - this.puffProgress) * step;

        // 3. Динамическое изменение размеров и спрайта
        // Если раздута больше чем на половину — меняем картинку
        this.imgKey = this.puffProgress > 0.5 ? "fugu_fish2" : "fugu_fish";
        
        const currentScale = this.normalSize + (this.puffedSize - this.normalSize) * this.puffProgress;
        this.w = currentScale;
        this.h = currentScale * 0.85; // Чуть приплюснутая

        // 4. "Характер" движения
        if (this.isPuffed) {
            // Когда надута, она становится неповоротливой и "тяжелой"
            this.vx *= 0.92;
            this.vy *= 0.92;
            
            // Добавим легкое дрожание, если она напугана
            this.x += (Math.random() - 0.5) * this.puffProgress * 2;
        } else {
            // Обычное ленивое плавание
            if (Math.random() < 0.01) {
                this.targetVx = (Math.random() - 0.5) * 1.5;
                this.targetVy = (Math.random() - 0.5) * 0.8;
            }
            this.vx += (this.targetVx - this.vx) * 0.02;
            this.vy += (this.targetVy - this.vy) * 0.02;
        }

        // Живое покачивание вверх-вниз
        this.bobTimer += 0.05;
        this.y += Math.sin(this.bobTimer) * 0.15;

        // Вызов базы для физики воды и границ
        super.update(dt, player, world);
    }

    draw(ctx, assets) {
        // Если в ParticleManager есть пузырьки, можно спавнить их тут, когда puffProgress растет
        super.draw(ctx, assets);
    }
}