// src/entities/player/accessories/AccessoryManager.js
import { assets } from "../../../core/Braw.js"; // Или как у тебя экспортируются ассеты

export class AccessoryManager {
    constructor(player) {
        this.player = player;
        this.activeAccessories = {};
    }

    update() {
        // Очищаем текущие активные эффекты
        this.activeAccessories = {
            canBreatheUnderwater: false,
            // Сюда потом добавишь: fireImmunity, extraJump и т.д.
        };

        // Проверяем слоты аксессуаров из инвентаря
        if (this.player.inventory && this.player.inventory.accessorySlots) {
            for (const slot of this.player.inventory.accessorySlots) {
                if (slot) this.applyAccessoryEffect(slot);
            }
        }
    }

    applyAccessoryEffect(item) {
        if (item.id === 'air_bubble_acc') {
            this.activeAccessories.canBreatheUnderwater = true;
        }
        // В будущем тут будут if-ы или switch для других предметов
    }

    // Отрисовка визуальных эффектов (например, сам пузырь поверх игрока)
render(ctx) {
        if (this.activeAccessories.canBreatheUnderwater) {
            // ВЫДЕЛЯЕМ РАЗМЕР В ПЕРЕМЕННУЮ
            // Поменяй 2.2 на 2.5 или 3.0, если захочешь сделать еще больше!
            const bubbleSize = this.player.size * 2.2; 

            // Считаем координаты так, чтобы центр пузыря совпадал с центром игрока
            const x = this.player.x + (this.player.size / 2) - (bubbleSize / 2);
            
            // Сдвиг по Y: вычитаем bubbleSize, чтобы низ пузыря слегка заходил на плечи/голову
            // -15 — это дополнительный зазор вверх/вниз, можешь подкрутить по вкусу
            const y = this.player.y + (this.player.size / 2) - (bubbleSize / 2) - 3; 

            // Если ассет загрузился
            if (assets.air_bubble_item && assets.air_bubble_item.complete) {
                ctx.globalAlpha = 0.6; // Сделал чуть прозрачнее (0.6 вместо 0.7), чтобы большой пузырь не перекрывал обзор
                ctx.drawImage(assets.air_bubble_item, x, y, bubbleSize, bubbleSize);
                ctx.globalAlpha = 1.0;
            }
        }
    }
}