// height.js
import { CONFIG } from "../../data/config.js";
import { fbm, WORLD_SEED, getLakeIntensity } from "../Seed.js"; // Импортируем новую функцию
import { getBiomeMix } from "./BiomeMap.js";

export function getHeight(x){
    const base = CONFIG.groundY; 
    const mix = getBiomeMix(x);
    const lakeFactor = Math.max(0, getLakeIntensity(x)); // Гарантируем, что не отрицательно
    // Глубина зависит от силы озера
    // Если lakeFactor = 0, depth = 0.
    const depth = lakeFactor * -700; 

    // ЗОНЫ ХАОСА
    let chaos = fbm(x,{
        scale:0.00005,
        octaves:2,
        seed:WORLD_SEED+9000
    });
    chaos = Math.abs(chaos);
    chaos = Math.pow(chaos, 2);

    // ОСНОВА 
    const baseNoise = fbm(x,{
        scale:0.0012,
        octaves:5,
        seed:WORLD_SEED
    });

    // ГОРЫ 
    const mountains = fbm(x,{
        scale:0.00015,
        octaves:4,
        seed:WORLD_SEED+1000
    });

    // ЯМЫ 
    const pits = fbm(x,{
        scale:0.00025,
        octaves:3,
        seed:WORLD_SEED+4000
    });

    // ДЕТАЛИ (Мелкие камушки, которые портят воду)
    const detail = fbm(x,{
        scale:0.008,
        octaves:2,
        seed:WORLD_SEED+2000
    });

    // АМПЛИТУДЫ
    const desertAmp = 25;
    const plainsAmp = 40;
    const forestAmp = 90;
    const jungleAmp = 160;
    const snowAmp = 250;

    const amp =
        desertAmp * mix.desert +
        plainsAmp * mix.plains +
        forestAmp * mix.forest +
        jungleAmp * mix.jungle +
        snowAmp * mix.snow;

    // Сглаживаем горы внутри озера
    const suppression = Math.max(0, 1 - lakeFactor * 1.5); 

    // ИТОГОВАЯ ВЫСОТА
    let height = base;

    height += baseNoise * amp; 
    height += mountains * 6000 * chaos * suppression; 
    height += pits * -900 * chaos * suppression;     

    // Применяем глубину озера
    height -= depth;

    // Детали оставляем
    height += detail * 25;

    return height;
}