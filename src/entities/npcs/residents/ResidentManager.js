//ResidentManager.js
import { Resident } from "./Resident.js";

export class ResidentManager {
    constructor() {
        this.residents = [];
    }

spawnForVillage(startX, endX, layoutObjects) {
    let houseCount = 0;
    layoutObjects.forEach(obj => {
        if (obj.imgKey && obj.imgKey.includes("house")) {
            houseCount++;
        }
    });

    if (houseCount === 0) return;

    // ИСПРАВЛЕНИЕ: Ширина башни (village_tower) равна 250, а не 60!
    const columnWidth = 250; 
    // Задаем границы. startX и endX — это абсолютные края деревни.
    const safeMinX = startX + columnWidth;
    const safeMaxX = endX - columnWidth;

    const residentsCount = houseCount * (Math.floor(Math.random() * 2) + 1);
    
    for (let i = 0; i < residentsCount; i++) {
        // Спавним строго в обновленной безопасной зоне
        const randomX = safeMinX + Math.random() * (safeMaxX - safeMinX);
        this.residents.push(new Resident(randomX, safeMinX, safeMaxX)); 
    }
}
    // ВАЖНО: Принимаем world, audioManager, player, dt
    update(world, audioManager, player, dt) {
        this.residents.forEach(r => {
            r.update(world, audioManager, player, dt);
        });
    }

    draw(ctx, renderCamX, screenWidth) {
        this.residents.forEach(r => {
            if (r.x > renderCamX - 100 && r.x < renderCamX + screenWidth + 100) {
                r.draw(ctx);
            }
        });
    }
}

export const residentManager = new ResidentManager();