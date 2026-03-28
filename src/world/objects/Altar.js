//Altar.js
export class Altar {
    constructor(x, y, bossKey) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 80;
        this.type = "altar"; // Чтобы отличать от статуй
        
        // Подбираем картинку в зависимости от босса
        const imgMap = {
            'cube_boss': 'a_forest',
            'desert_boss': 'a_desert',
            'jungle_boss': 'a_jungli',
            'ice_boss': 'a_glazed'
        };
        this.imgKey = imgMap[bossKey] || 'a_forest';
    }

    interact(player) {
        console.log("Алтарь пока спит... Ждет духа хранителя.");
        // Здесь потом будет логика призыва очистителя
    }

    draw(ctx, assets) {
        const img = assets[this.imgKey]; 
        if (!img || !img.complete) return;

        ctx.drawImage(
            img,
            this.x - this.width / 2, 
            this.y - this.height,    
            this.width,
            this.height
        );
    }
}