import { world } from "../../world/World.js";

export function checkWallCollisions(player, axis) {
    if (!world.chunkManager) return;

    const chunkId = world.chunkManager.getChunkId(player.x);
    const chunk = world.chunkManager.chunks.get(chunkId);
    if (!chunk || !chunk.objects) return;

    for (let obj of chunk.objects) {
        if (
            obj.type !== "dungeon_wall" && 
            obj.type !== "village_wall" && 
            obj.type !== "jungle_seal" 
        ) continue;

        if (
            player.x < obj.x + obj.width &&
            player.x + player.size > obj.x &&
            player.y < obj.y + obj.height && 
            player.y + player.size > obj.y 
        ) {
            if (axis === 'x') {
                if (player.velocityX > 0) { 
                    player.x = obj.x - player.size;
                } else if (player.velocityX < 0) { 
                    player.x = obj.x + obj.width;
                }
                player.velocityX = 0;
            }
            
            if (axis === 'y') {
                if (player.velocityY > 0) { 
                    player.y = obj.y - player.size; 
                    player.velocityY = 0;
                    player.onGround = true; 
                } else if (player.velocityY < 0) { 
                    player.y = obj.y + obj.height;
                    player.velocityY = 0;
                }
            }
        }
    }
}