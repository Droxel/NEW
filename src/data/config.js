/* src/core/config.js */
export const CONFIG = {
  // Теперь берем реальный размер экрана телефона
  width: window.innerWidth,
  height: window.innerHeight,

  // Рассчитываем уровень земли относительно высоты экрана
  // (Например, земля всегда в 50 пикселях от низа)
  groundY: window.innerHeight - 50,
  waterLevel: window.innerHeight - 30,
  
  gravity: 0.6,
  speed: 300, // Немного уменьшил, а то на большом экране будет летать
  jumpPower: 15,
  
  SKY: {
    cycleDuration: 900, // Длительность суток

colors: {
      midnight: { top: [5, 5, 20],   bottom: [10, 10, 35] },
      dawn:     { top: [60, 40, 100],  bottom: [255, 120, 70] },
      noon:     { top: [70, 150, 255], bottom: [180, 230, 255] },
      dusk:     { top: [40, 30, 90],   bottom: [255, 80, 40] },
    },

    stars: {
      count: 100,      // Чуть меньше, но ярче
      starfallChance: 0.01, // 1% шанс (1 из 100 ночей) на мощный звездопад
    },

    clouds: {
      countCloudy: 6,  // Много облаков
      countClear: 0,   // В ясную погоду 0 облаков (старые улетят)
      speedMin: 10,
      speedMax: 30,
      // Цвет подсветки облаков снизу на закате/рассвете
      sunsetGlow: { r: 255, g: 140, b: 100 } 
    },

    comets: {
      chanceNormal: 0.0005, // Очень редко в обычную ночь
      chanceShower: 0.08,   // Часто во время звездопада
    }
  }
};