// src/world/objects/Altar.js
import { BIOME_CORES, BIOME_WEAPONS } from "../../data/lootConfig.js";
import { DroppedItem } from "./DroppedItem.js";
import { world } from "../World.js";
import { ritualManager } from "../../core/RitualManager.js";
import { audioManager } from "../../core/AudioManager.js"; // Добавь эту строку к остальным импортам

export class Altar {
    constructor(x, y, bossKey) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 80;
        this.bossKey = bossKey; 
        
        const imgMap = {
            'forest_boss': 'a_forest', 
            'desert_boss': 'a_desert',
            'jungle_boss': 'a_jungli',
            'ice_boss': 'a_glazed'
        };
        this.imgKey = imgMap[bossKey] || 'a_forest';

        this.ritualState = 'idle';
        this.ritualTimer = 0;

        this.coreItem = BIOME_CORES[this.bossKey];
        this.weaponItem = BIOME_WEAPONS[this.bossKey];
        
        // Позиции для отрисовки магии
        this.visualX = this.x;
        this.visualY = this.y - 40; 
        this.visualScale = 1;
        
        console.log(`Алтарь создан для: ${this.bossKey}. Ищет предмет:`, this.coreItem?.id);
    }

checkForCoreNearby() {
    if (!this.coreItem) return;

    // СМОТРИМ В ГЛОБАЛЬНЫЙ МАССИВ, который наполняет BossManager
    const items = window.droppedItems || [];

    for (let i = 0; i < items.length; i++) {
        const obj = items[i];
        
        // Проверяем ID предмета (ядро нужного биома)
        if (obj.itemData && obj.itemData.id === this.coreItem.id) {
            
            const distX = this.x - obj.x;
            const distY = this.y - obj.y;
            const distance = Math.sqrt(distX * distX + distY * distY);

            // Если предмет рядом (убираем onGround, чтобы ловить даже в полете)
            if (distance < 130) {
                this.visualX = obj.x;
                this.visualY = obj.y;
                
                // УДАЛЯЕМ ИЗ ГЛОБАЛЬНОГО МАССИВА
                items.splice(i, 1); 
                
                console.log("✨ Алтарь поймал ядро из window.droppedItems!");
                this.ritualState = 'absorb'; 
                this.ritualTimer = 0;
                this.visualScale = 1;
                break;
            }
        }
    }
}

    interact(player) {
        if (this.ritualState === 'idle') {
            console.log(`Подсказка: Брось ${this.coreItem.name} рядом с алтарем.`);
        }
    }

    update(dt) {
        if (this.ritualState === 'idle') {
            this.checkForCoreNearby();
            return; 
        }
        
        this.ritualTimer++;

        // 1. ПОДТЯГИВАНИЕ К ЦЕНТРУ АЛТАРЯ
        if (this.ritualState === 'absorb') {
            const targetX = this.x;
            const targetY = this.y - 40;
            
            // Плавное движение (Lerp) от земли к центру алтаря
            this.visualX += (targetX - this.visualX) * 0.1;
            this.visualY += (targetY - this.visualY) * 0.1;

            // Когда прилетело в центр - переходим к поднятию
            if (Math.abs(this.visualX - targetX) < 2 && Math.abs(this.visualY - targetY) < 2) {
                this.ritualState = 'levitate';
                this.ritualTimer = 0;
            }
        }
        // 2. МЕДЛЕННО ПОДНИМАЕТСЯ ВВЕРХ
        else if (this.ritualState === 'levitate') {
            this.visualY -= 0.5; 
            if (this.ritualTimer > 60) {
                this.ritualState = 'deform';
                this.ritualTimer = 0;
            }
        } 
        // 3. ПУЛЬСИРУЕТ И РАСТЕТ (Деформируется)
        else if (this.ritualState === 'deform') {
            // Математика пульсации + постепенное общее увеличение
            this.visualScale = 1 + Math.sin(this.ritualTimer * 0.3) * 0.4 + (this.ritualTimer * 0.008);
            
            if (this.ritualTimer > 90) { // Длится 1.5 секунды
                this.ritualState = 'sink';
                this.ritualTimer = 0;
            }
        } 
// 4. РЕЗКО ПАДАЕТ ВНИЗ ПОД ЗЕМЛЮ
        else if (this.ritualState === 'sink') {
            this.visualY += 15; // Огромная скорость падения
            this.visualScale -= 0.15; // Сжимается в точку
            if (this.visualScale <= 0) this.visualScale = 0;
            
            if (this.visualY > this.y + 70) { // Ушло глубоко под текстуру алтаря
                this.ritualState = 'earthquake';
                this.ritualTimer = 0;
                
                // --- ДОБАВЛЯЕМ ЗВУК ТУТ ---
                // Запускаем звук. Я поставил громкость 0.8, чтобы было мощно
                audioManager.playSFX('world/Earthquake.wav', 0.8); 
            }
        }
// 5. ЗЕМЛЕТРЯСЕНИЕ
else if (this.ritualState === 'earthquake') {
    ritualManager.screenShake = 8; // Включаем глобальную тряску!
    
    if (this.ritualTimer > 240) { 
        // --- ВОТ ТУТ ГЛАВНАЯ ПРАВКА ---
        ritualManager.screenShake = 0; // ОСТАНАВЛИВАЕМ ТРЯСКУ, когда фаза закончилась
        
        this.ritualState = 'weapon_rise';
        this.ritualTimer = 0;
        this.visualX = this.x;
        this.visualY = this.y + 30; // Оружие стартует из-под земли
        this.visualScale = 0;
    }
}
        // 6. ПОЯВЛЕНИЕ ОРУЖИЯ БИОМА
        else if (this.ritualState === 'weapon_rise') {
            this.visualY -= 1.2; // Всплывает
            this.visualScale += 0.02; // Раскрывается
            
            if (this.visualScale >= 1.5) { 
                this.visualScale = 1.5;
            }
            
            // Ждем, пока поднимется над алтарем, затем спавним реальный предмет
            if (this.ritualTimer > 110 && this.visualY <= this.y - 45) {
                this.ritualState = 'idle';
                this.spawnWeapon(); 
            }
        }
    }

spawnWeapon() {
    if (this.weaponItem) {
        const weapon = new DroppedItem(this.x, this.visualY, this.weaponItem);
        weapon.vy = -6;
        weapon.pickupDelay = 90;
        
        // ПУШИМ В ОБЩИЙ СПИСОК
        if (!window.droppedItems) window.droppedItems = [];
        window.droppedItems.push(weapon);

        console.log("⚔️ Ритуал завершен! Оружие добавлено в window.droppedItems");
    }
}

    draw(ctx, assets) {
        const img = assets[this.imgKey]; 
        if (!img || !img.complete) return;

        let shakeX = 0;
        let shakeY = 0;
        
        // Визуальная тряска во время землетрясения
        if (this.ritualState === 'earthquake') {
            shakeX = (Math.random() - 0.5) * 15; // Довольно сильная амплитуда
            shakeY = (Math.random() - 0.5) * 15;
        }

        // Рисуем сам алтарь
        ctx.drawImage(
            img,
            this.x - this.width / 2 + shakeX, 
            this.y - this.height + shakeY,    
            this.width,
            this.height
        );

        // Рисуем эффекты магии (Ядро или Оружие)
        if (this.ritualState !== 'idle') {
            ctx.save();
            // Обрати внимание: теперь используется visualX, чтобы ядро летело сбоку!
            ctx.translate(this.visualX + shakeX, this.visualY + shakeY);
            ctx.scale(this.visualScale, this.visualScale);

            if (['absorb', 'levitate', 'deform', 'sink'].includes(this.ritualState) && this.coreItem) {
                const coreImg = new Image();
                coreImg.src = this.coreItem.icon;
                
                // Свечение усиливается на этапе пульсации/деформации
                let glowIntensity = this.ritualState === 'deform' ? 45 : 20;
                ctx.shadowBlur = glowIntensity;
                ctx.shadowColor = "#00ffcc"; 
                ctx.drawImage(coreImg, -15, -15, 30, 30);
            } 
            else if (this.ritualState === 'weapon_rise' && this.weaponItem) {
                const wpnImg = new Image();
                wpnImg.src = this.weaponItem.icon;
                ctx.shadowBlur = 35;
                ctx.shadowColor = "#ff00ff"; // Для оружия свечение пурпурное
                ctx.drawImage(wpnImg, -20, -20, 40, 40);
            }

            ctx.restore();
        }
    }
}