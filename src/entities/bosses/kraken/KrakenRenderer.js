//KrakenRenderer.js
export class KrakenRenderer {
    static draw(ctx, kraken, assets) {
        const { x, y, time, tentacleTemplate } = kraken;

        ctx.save();
        ctx.translate(x, y);

        // 1. Рисуем 8 щупалец
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8; // Равномерно по кругу
            const wiggle = Math.sin(time + i) * 0.1; // Индивидуальное "дрыганье"

            ctx.save();
            ctx.rotate(angle + wiggle);

            tentacleTemplate.forEach((part, index) => {
                // Вытаскиваем номер из имени "tentacles10.png" -> 10
                const imgNum = parseInt(part.name.match(/\d+/)[0]);
                const img = assets.kraken.tentacles[imgNum];

                if (img) {
                    ctx.save();
                    // Эффект изгиба щупальца: чем дальше сегмент, тем сильнее дрыгается
                    const wave = Math.sin(time * 2 + index * 0.3) * (index * 2);
                    
                    ctx.translate(part.ox + wave, part.oy);
                    
                    // Отзеркаливание если нужно
                    if (part.flipX) ctx.scale(-1, 1);
                    
                    ctx.drawImage(img, -part.w / 2, -part.h / 2, part.w, part.h);
                    ctx.restore();
                }
            });
            ctx.restore();
        }

        // 2. Рисуем голову сверху
        const headImg = assets.kraken.head;
        if (headImg.complete) {
            ctx.drawImage(headImg, -150, -150, 300, 300); // Размер головы подправь сам
        }

        ctx.restore();
    }
}