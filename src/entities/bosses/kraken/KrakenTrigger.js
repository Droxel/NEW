// src/entities/bosses/kraken/KrakenTrigger.js
import { OCEAN } from "../../../world/Ocean.js"; 
import { krakenManager } from "./KrakenManager.js"; 
import { weatherManager } from "../../../world/sky/Weather.js";
// ИМПОРТИРУЕМ МЕНЕДЖЕР СВЕТА:
import { lightingManager } from "../../../world/LightingManager.js";

export class KrakenTriggerManager {
    constructor() {
        this.triggers = [];
        this.initTriggers();
    }

    initTriggers() {
        const oceanMidPoint = OCEAN.START + (OCEAN.WIDTH / 2); 
        this.triggers = [
            { x: oceanMidPoint, direction: 1, activated: false },
            { x: -oceanMidPoint, direction: -1, activated: false }
        ];
    }

    update(ship) {
        if (!ship || ship.state === 'sleeping' || ship.state === 'stopping' || ship.state === 'dead') return;

        this.triggers.forEach(trigger => {
            if (!trigger.activated) {
                const shipCenter = ship.x + ship.width / 2;
                
                const crossedRight = trigger.direction === 1 && shipCenter >= trigger.x;
                const crossedLeft = trigger.direction === -1 && shipCenter <= trigger.x;

                if (crossedRight || crossedLeft) {
                    console.log("%c⚓ СЕРЕДИНА ОКЕАНА: Остановка и пробуждение ужаса...", "color: #00d4ff;");
                    trigger.activated = true;
                    
                    if (ship.startDeathSequence) ship.startDeathSequence();
                    
                    krakenManager.prepareSpawn(ship); 
                    
                    weatherManager.setTargetWeather('storm');

                    // ПОДНИМАЕМ ТЬМУ ИЗ ГЛУБИН:
                    // -250 означает, что верхняя граница градиента тьмы поднимется на 250 пикселей ВЫШЕ уровня воды.
                    // Корабль окажется поглощен полумраком, и будут видны только факелы/фонари.
                    lightingManager.setDarknessOffset(-250);
                }
            }
        });
    }
}