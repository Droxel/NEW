//OceanCreatureManager.js
import { OCEAN_SPAWN_CONFIG } from "../../../data/OceanSpawnConfig.js";
import { Fish } from "./Fish.js";
import { Pufferfish } from "./Pufferfish.js";
import { Jellyfish } from "./Jellyfish.js";

export class OceanCreatureManager {
    constructor() {
        this.creatures = [];
    }

    update(dt, player, world) {
        // Убрали жесткую проверку координат player.x < 1000!
        
        // Удаление тех, кто уплыл слишком далеко от игрока
        this.creatures = this.creatures.filter(c => {
            const dist = Math.hypot(player.x - c.x, player.y - c.y);
            return dist < OCEAN_SPAWN_CONFIG.despawnDistance && !c.markedForDeletion;
        });

        // Спавн новых, если их мало
        if (this.creatures.length < OCEAN_SPAWN_CONFIG.maxCreatures) {
            this.trySpawn(player, world);
        }

        // Обновление физики
        this.creatures.forEach(c => c.update(dt, player, world));
    }

    trySpawn(player, world) {
        // 1. Выбираем случайный X слева или справа от камеры
        const dir = Math.random() > 0.5 ? 1 : -1;
        const distX = OCEAN_SPAWN_CONFIG.spawnRadius * (0.5 + Math.random() * 0.5); // От 50% до 100% радиуса
        const spawnX = player.x + (dir * distX);

        // 2. Получаем данные о столбе воды на этом X (Y не передаем!)
        const waterData = world.getWaterData(spawnX);
        
        // 3. Главная проверка: Спавним ТОЛЬКО если это вода и ТОЛЬКО если это ОКЕАН
        if (!waterData.isWater || !waterData.isOcean) return;

        // 4. Высчитываем безопасную глубину для спавна (между поверхностью и дном)
        const minDepth = waterData.level + 50; 
        const maxDepth = waterData.bottom - 50;

        // Если в этом месте океан слишком мелкий (например, у берега) - отмена
        if (maxDepth <= minDepth) return;

        // Берем случайную глубину
        const spawnY = minDepth + Math.random() * (maxDepth - minDepth);

        console.log(`Успешный спавн рыбы в океане! Координаты: X:${Math.floor(spawnX)}, Y:${Math.floor(spawnY)}`);

        const roll = Math.random() * 100;

        if (roll < OCEAN_SPAWN_CONFIG.weights.pufferfish) {
            this.creatures.push(new Pufferfish(spawnX, spawnY));
        } else if (roll < OCEAN_SPAWN_CONFIG.weights.pufferfish + OCEAN_SPAWN_CONFIG.weights.jellyfish) {
            this.creatures.push(new Jellyfish(spawnX, spawnY));
        } else {
            this.spawnSchool(spawnX, spawnY);
        }
    }

    spawnSchool(x, y) {
        const count = Math.floor(Math.random() * (OCEAN_SPAWN_CONFIG.schoolSize.max - OCEAN_SPAWN_CONFIG.schoolSize.min)) + OCEAN_SPAWN_CONFIG.schoolSize.min;
        const isClownfish = Math.random() > 0.5;

        // ОТСЫЛКА НА НЕМО: Если рыба клоун спавнится одна, добавляем ей в пару Дори
        if (isClownfish && count === 1) {
            this.creatures.push(new Fish(x, y, "clownfish"));
            this.creatures.push(new Fish(x + 20, y - 10, "dory"));
            return;
        }

        for (let i = 0; i < count; i++) {
            const offsetX = (Math.random() - 0.5) * 100;
            const offsetY = (Math.random() - 0.5) * 100;
            const type = isClownfish ? "clownfish" : "dory";
            this.creatures.push(new Fish(x + offsetX, y + offsetY, type));
        }
    }

draw(ctx, assets, camX, camY) {
    this.creatures.forEach(c => {
        // Проверка видимости (Frustum Culling)
        if (c.x > camX - 500 && c.x < camX + 2500) { 
             c.draw(ctx, assets, camX, camY); // Вызывает исправленный метод выше
        }
    });
}
}

export const oceanCreatureManager = new OceanCreatureManager();