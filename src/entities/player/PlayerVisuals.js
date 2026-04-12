export function updateVisuals(player) {
    player.lookX += (player.targetLookX - player.lookX) * 0.15;
    
    // Масштабирование (скейл) при прыжках и приземлениях
    if (!player.onGround) {
        player.scaleY += (1.15 - player.scaleY) * 0.2;
        player.scaleX += (0.9 - player.scaleX) * 0.2;
    } else {
        player.scaleX += (1 - player.scaleX) * 0.25;
        player.scaleY += (1 - player.scaleY) * 0.25;
    }

    // Блики (моргание)
    player.blinkTimer++;
    if (player.blinkTimer > 180 && Math.random() < 0.02) {
        player.blink = 1;
        player.blinkTimer = 0;
    }
    player.blink += (0 - player.blink) * 0.2;

    // Вращение кубика (не крутится, если в воде или на крюке)
    if (!player.onGround && player.rotationDir !== 0 && !(player.hook && player.hook.active) && !player.isInWater) {
        player.rotation += player.rotationSpeed * player.rotationDir;
    } else if (player.onGround || player.isInWater) {
        // Если в воде или на земле — плавно выравниваемся вертикально
        const snapped = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
        player.rotation += (snapped - player.rotation) * 0.3;
    }
}