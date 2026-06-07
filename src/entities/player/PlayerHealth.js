//PlayerHealth.js
export function takeDamage(player, amount) {
    if (player.invulnerableTimer > 0) return;
    player.hp -= amount;
    player.invulnerableTimer = 60;
    player.timeSinceLastHit = 0;
    player.regenTimer = 0;
    console.log("Player hit! HP:", player.hp);
}

export function updateHealthAndAir(player) {
    // 1. Таймеры и регенерация
    if (player.invulnerableTimer > 0) player.invulnerableTimer--;
    if (player.potionCooldown > 0) player.potionCooldown--;
    
    if (player.hp < player.maxHp) {
        player.timeSinceLastHit++;
        if (player.timeSinceLastHit > 300) {
            player.regenTimer++;
            if (player.regenTimer >= 180) {
                player.hp++;
                player.regenTimer = 0;
            }
        }
    }

    // 2. Система дыхания в воде
    if (player.isInWater) {
        player.currentColor = "#0a1240"; 
        
        player.airTimer++;
        if (player.airTimer >= 60) {
            if (player.air > 0) {
                player.air--;
            } else {
                takeDamage(player, 1); // Вызываем локальную функцию takeDamage
            }
            player.airTimer = 0;
        }
    } else {
        player.currentColor = player.baseColor;
        player.air = player.maxAir;
        player.airTimer = 0;
    }
}

export function eatPotion(player) {
    if (player.potionCooldown > 0) return;
    if (player.hp >= player.maxHp) return;

    if (!player.inventory || !player.inventory.mainSlots) return;
    
    const potionIndex = player.inventory.mainSlots.findIndex(item => item && item.id === 'potion_hp');

    if (potionIndex !== -1) {
        player.hp = Math.min(player.hp + 5, player.maxHp);
        
        player.inventory.mainSlots[potionIndex].count--;

        if (player.inventory.mainSlots[potionIndex].count <= 0) {
            player.inventory.mainSlots[potionIndex] = null;
        }

        player.potionCooldown = 300;
        
        console.log("❤️ Здоровье восстановлено! HP:", player.hp);
        
        if (window.inventoryUIInstance) {
            window.inventoryUIInstance.refresh(); 
        }
    } else {
        console.log("❌ Зелья 'potion_hp' нет в инвентаре");
    }
}