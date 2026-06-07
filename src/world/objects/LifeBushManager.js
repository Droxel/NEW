/* src/world/objects/LifeBushManager.js */
import { hash, WORLD_SEED } from "../Seed.js"; 
import { LifeBush } from "./LifeBush.js";

export class LifeBushManager {
    static generateBushesForChunk(chunk, world) {
        const startX = chunk.id * 1024;
        const endX = startX + 1024;
        
        // 1. Увеличиваем шаг проверки.
        // Было 200, стало 600. Проверяем реже = меньше кустов.
        const SPACING = 600; 

        let x = Math.ceil(startX / SPACING) * SPACING;

        while (x < endX) {
            const chance = hash(x + WORLD_SEED + 998877); 
            
            // 2. Увеличиваем сложность выпадения.
            // Было > 0.89 (11%), стало > 0.93 (7% шанс).
            if (chance > 0.90) { 
                if (!world.isWater(x)) {
                    const jitter = (hash(x * 3) - 0.5) * 50; 
                    const finalX = x + jitter;
                    
                    // --- 🔥 ФИКС: ДИСТАНЦИЯ ---
                    // Проверяем, есть ли другой куст в радиусе 800 пикселей (было 10)
                    // Это не даст им спавниться в куче.
                    const isTooClose = chunk.objects.some(obj => 
                        obj.type === "life_bush" && Math.abs(obj.x - finalX) < 800
                    );

                    if (isTooClose) {
                        x += SPACING;
                        continue; // Слишком близко к другому, пропускаем
                    }
                    // ----------------------------------------

                    const bushWidth = 30; 
                    const leftY = world.getHeight(finalX);
                    const rightY = world.getHeight(finalX + bushWidth);
                    const centerX = world.getHeight(finalX + bushWidth / 2);
                    
                    const diff = Math.abs(leftY - rightY);
                    const slopeThreshold = 4; 

                    if (diff <= slopeThreshold) {
                        const groundY = Math.max(leftY, rightY, centerX);
                        const visualY = (groundY + 30) - 50; 

                        const bush = new LifeBush(finalX, visualY);
                        
                        chunk.objects.push({
                            type: "life_bush", 
                            instance: bush,
                            x: bush.x,
                            y: bush.y,
                            width: bush.width, 
                            height: bush.height, 
                            zIndex: 1 
                        });
                        
                        console.log(`🌳 Редкий куст жизни на x: ${Math.floor(finalX)}`);
                    }
                }
            }
            x += SPACING;
        }
    }
}