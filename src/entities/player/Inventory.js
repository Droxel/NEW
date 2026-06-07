// src/core/Inventory.js 
export class Inventory {
    constructor() {
        this.mainSlots = new Array(15).fill(null); 
        this.accessorySlots = new Array(9).fill(null);
        this.currencySlots = new Array(3).fill(null);
        this.bubbleSlots = new Array(3).fill(null); // НОВОЕ: 0 - Пузырь, 1 - Оружие
        this.maxStack = 99; 
    }

    // Универсальный метод добавления
    addItem(item) {
        if (!item) return false;

        // 1. Автоматическая сортировка кристаллов (валюты)
        if (item.type === 'crystal' || item.id === 'crystal') {
            return this.addCrystal(item.count || 1);
        }

        const amountToAdd = item.count || 1;

        // --- ЗАЩИТА ОТ ДЮПА ЧАСТИЧНОГО ПОДБОРА ---
        // Считаем, есть ли место под весь стак, чтобы не было "фантомных" остатков
        let availableSpace = 0;
        for (let slot of this.mainSlots) {
            if (slot === null) {
                availableSpace += this.maxStack;
            } else if (slot.id === item.id) {
                availableSpace += this.maxStack - slot.count;
            }
        }

        if (availableSpace < amountToAdd) {
            console.log("🎒 Инвентарь полон! Нельзя подобрать этот стак.");
            return false; 
        }
        // -----------------------------------------

        // 2. Сначала пробуем добавить в существующий стак
        for (let i = 0; i < this.mainSlots.length; i++) {
            let slot = this.mainSlots[i];
            if (slot && slot.id === item.id) {
                if (slot.count < this.maxStack) {
                    const space = this.maxStack - slot.count;
                    const canAdd = Math.min(amountToAdd, space);
                    slot.count += canAdd;
                    
                    // Если предмет пришел стаком и не влез целиком, остаток ищем куда приткнуть
                    const remainder = amountToAdd - canAdd;
                    if (remainder > 0) {
                        return this.addItem({ ...item, count: remainder });
                    }
                    return true;
                }
            }
        }

        // 3. Если стака нет или он полон, ищем пустой слот
        const emptyIndex = this.mainSlots.indexOf(null);
        if (emptyIndex !== -1) {
            const toAdd = Math.min(amountToAdd, this.maxStack);
            this.mainSlots[emptyIndex] = { ...item, count: toAdd };
            
            const remainder = amountToAdd - toAdd;
            if (remainder > 0) {
                return this.addItem({ ...item, count: remainder }); // Рекурсивно добавляем остаток
            }
            return true;
        }

        return false;
    }

    // Подсчет кристаллов
    getCrystalCount() {
        let total = 0;
        for (let slot of this.currencySlots) {
            if (slot && (slot.type === 'crystal' || slot.id === 'crystal')) {
                total += slot.count;
            }
        }
        return total;
    }

    hasHook() {
        // Проверяем основные слоты и аксессуары (на случай, если крюк там)
        const allSlots = [...this.mainSlots, ...this.accessorySlots, ...this.bubbleSlots];
        return allSlots.some(item => item && (item.id === 'hook' || item.type === 'hook'));
    }

    // Трата кристаллов
    spendCrystals(amount) {
        if (this.getCrystalCount() < amount) return false;

        let remaining = amount;
        for (let i = 0; i < this.currencySlots.length; i++) {
            const slot = this.currencySlots[i];
            if (slot && (slot.type === 'crystal' || slot.id === 'crystal')) {
                if (slot.count > remaining) {
                    slot.count -= remaining;
                    remaining = 0;
                    break;
                } else {
                    remaining -= slot.count;
                    this.currencySlots[i] = null;
                }
            }
        }
        return remaining === 0;
    }

    findItemIndex(id) {
        return this.mainSlots.findIndex(item => item && item.id === id);
    }

    // ИСПРАВЛЕНИЕ: Теперь можно удалять предметы из любого массива, по умолчанию — mainSlots
consumeItem(index, targetArray = this.mainSlots) {
    if (targetArray[index]) {
        targetArray[index].count--;
        
        // Гарантируем, что если предмет кончился, слот становится СТРОГО null
        if (targetArray[index].count <= 0) {
            targetArray[index] = null;
            return null; // Возвращаем null как сигнал, что стак пуст
        }
        return targetArray[index]; // Возвращаем остаток стака
    }
    return false;
}

    // Метод для добавления кристаллов в спец. слоты
    addCrystal(amount = 1) {
        // --- ЗАЩИТА ОТ ДЮПА КРИСТАЛЛОВ ---
        let availableSpace = 0;
        for (let slot of this.currencySlots) {
            if (slot === null) {
                availableSpace += this.maxStack;
            } else if (slot.type === 'crystal' || slot.id === 'crystal') {
                availableSpace += this.maxStack - slot.count;
            }
        }

        if (availableSpace < amount) {
            console.log("💎 Нет места для кристаллов!");
            return false;
        }
        // ----------------------------------

        // Сначала заполняем существующие стаки в currencySlots
        for (let i = 0; i < this.currencySlots.length; i++) {
            if (amount <= 0) break;
            let slot = this.currencySlots[i];
            if (slot && (slot.type === 'crystal' || slot.id === 'crystal') && slot.count < this.maxStack) {
                const space = this.maxStack - slot.count;
                const toAdd = Math.min(amount, space);
                slot.count += toAdd;
                amount -= toAdd;
            }
        }

        // Затем создаем новые стаки в пустых currencySlots
        if (amount > 0) {
            for (let i = 0; i < this.currencySlots.length; i++) {
                if (amount <= 0) break;
                if (this.currencySlots[i] === null) {
                    const toAdd = Math.min(amount, this.maxStack);
                    this.currencySlots[i] = { 
                        id: 'crystal', 
                        type: 'crystal', 
                        count: toAdd,
                        icon: '/assets/images/items/crystal.png' // Убедись, что путь верный
                    };
                    amount -= toAdd;
                }
            }
        }
        return amount === 0; 
    }
}