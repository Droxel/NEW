// src/data/villageBlueprints.js
export const VillageAssets = {
    // Колонны (башни), которые замыкают деревню
    wall: {
        imgKey: 'village_tower', 
        width: 250,   
        height: 550,    // Сделали пониже (было 450)
        hasCollision: true,
        yOffset: 40     // Вкапываем сильно глубже (было 30)
    },
// Дома (стали еще компактнее)
    houses: [
        { imgKey: 'village_house1', width: 110, height: 95,  yOffset: 25 },
        { imgKey: 'village_house2', width: 125, height: 105, yOffset: 25 },
        { imgKey: 'village_house3', width: 100, height: 90,  yOffset: 25 },
        { imgKey: 'village_house4', width: 140, height: 120, yOffset: 25 },
        { imgKey: 'village_kuznya', width: 125, height: 95,  yOffset: 25 }
    ],
    // Мелкий декор
    decor: [
        { imgKey: 'village_fire', width: 50, height: 50, yOffset: 15 },
        { imgKey: 'village_fountain', width: 100, height: 80, yOffset: 15 },
        { imgKey: 'village_pots', width: 30, height: 30, yOffset: 10 },
        { imgKey: 'village_tent', width: 120, height: 100, yOffset: 15 }
    ]
};