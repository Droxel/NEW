// src/world/structures/atlantis/AtlantisGenerator.js
import { WORLD_SEED } from "../../Seed.js"; 
import { OCEAN } from "../../Ocean.js";       
import { AtlantisPieces } from "./AtlantisPieces.js";
import { CursedCrystal } from "../../objects/CursedCrystal.js";
import { Statue } from "../../objects/Statue.js"; // <-- ДОБАВЬ ЭТУ СТРОКУ

function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

export class AtlantisGenerator {
    constructor() {
        this.clusterRadius = 4000; 
        this.objects = [];
        this.crystals = []; // Перенесли наверх! Теперь массив готов к работе
        
        this.generateGlobalAtlantis(); // Запускаем генерацию только после инициализации массивов
    }

    generateGlobalAtlantis() {
        const centerX = OCEAN.START + OCEAN.WIDTH / 2;
        this.buildCluster(centerX, WORLD_SEED + 777);
        this.buildCluster(-centerX, WORLD_SEED + 888);
    }

    isOverlappingSameType(newObj) {
        for (const existing of this.objects) {
            if (existing.imgKey !== newObj.imgKey) continue;
            if (existing.layer !== newObj.layer) continue;

            const isIntersecting = (
                newObj.x < existing.x + existing.w &&
                newObj.x + newObj.w > existing.x
            );

            if (isIntersecting) return true;
        }
        return false;
    }

    buildCluster(centerX, baseSeed) {
        let s = baseSeed;

        const bossW = 250;
        const bossX = centerX - bossW / 2;

        // 1. СТАТУЯ БОССА ОКЕАНА (Ярче всех)
        this.objects.push({
            type: "atlantis",
            layer: "fg", 
            x: bossX, 
            w: bossW,           
            h: 350,
            imgKey: "atlantis_statue_boss", 
            rotation: 0,
            scale: 1,
            flip: 1,
            isBossStatue: true // Флаг для идентификации
        });

        const safeRadiusFG = 600;
        const safeRadiusBG = 350;

        const numRuins = 55 + Math.floor(seededRandom(s++) * 20); 

        for (let i = 0; i < numRuins; i++) {
            const piece = AtlantisPieces[Math.floor(seededRandom(s++) * AtlantisPieces.length)];
            const targetLayer = seededRandom(s++) > 0.5 ? 'fg' : 'bg';
            const scaleMod = targetLayer === 'bg' ? (0.9 + seededRandom(s++) * 0.6) : (0.7 + seededRandom(s++) * 0.5);
            const finalW = piece.w * scaleMod;
            const finalH = piece.h * scaleMod;

            for (let attempt = 0; attempt < 10; attempt++) {
                let offsetX = (seededRandom(s++) - 0.5) * (this.clusterRadius * 2);
                const spawnedX = centerX + offsetX;

                if (targetLayer === 'fg') {
                    if (spawnedX + finalW >= bossX - safeRadiusFG && spawnedX <= bossX + bossW + safeRadiusFG) {
                        continue; 
                    }
                } else {
                    if (spawnedX + finalW >= bossX - safeRadiusBG && spawnedX <= bossX + bossW + safeRadiusBG) {
                        continue; 
                    }
                }

                const isEaster = piece.key === 'atlantis_statue_easter';

                const candidate = {
                    type: "atlantis",
                    layer: targetLayer,
                    x: spawnedX,
                    w: finalW,
                    h: finalH,
                    imgKey: piece.key,
                    rotation: isEaster ? 0.02 : (seededRandom(s++) - 0.5) * 0.2, 
                    flip: seededRandom(s++) > 0.5 ? -1 : 1,
                    isEasterStatue: isEaster, // Запоминаем, что это пасхалка
                    seed: s++ // Передаем индивидуальный сид для генерации огоньков
                };

                if (!this.isOverlappingSameType(candidate)) {
                    this.objects.push(candidate);
                    break;
                }
            }
        }
// Спавним кристалл чуть левее центра статуи
        this.objects.push({
            type: "cursed_crystal",
            layer: "fg",
            x: bossX - 100,
            w: 50,
            h: 50
        });
    }


getBlocksForChunk(chunkX, chunkWidth, world) {
        const chunkObjects = [];

        for (const obj of this.objects) {
            if (obj.x + (obj.w || 50) >= chunkX && obj.x < chunkX + chunkWidth) {
                
                // Если это кристалл — инициализируем его класс
                if (obj.type === "cursed_crystal") {
                    if (!obj.instance) {
                        const groundY = world.getHeight(obj.x + 25);
                        // Создаем экземпляр кристалла на уровне земли
                        obj.instance = new CursedCrystal(obj.x, groundY - 50);
                    }
                    chunkObjects.push(obj.instance);
                    continue;
                }

                // Логика для обычных руин Атлантиды
                const groundY = world.getHeight(obj.x + (obj.w / 2));
                const depth = (obj.layer === 'bg') ? 90 : 40;

                const instance = { 
                    ...obj, 
                    y: groundY - obj.h + depth 
                };

                const centerX = instance.x + instance.w / 2;
                const centerY = instance.y + instance.h / 2;

// ДОБАВЛЯЕМ ЛОГИКУ ДЛЯ СТАТУИ БОССА
if (obj.isBossStatue) {
    if (!obj.instance) {
        const groundY = world.getHeight(obj.x + (obj.w / 2));
        // Создаем реальную статую, импортировав класс Statue в начале файла
        // В config передаем ключ ocean_boss
        obj.instance = new Statue(obj.x + obj.w / 2, groundY - 50, {
            width: obj.w,
            height: obj.h,
            imgKey: obj.imgKey,
            bossKey: 'ocean_boss', // BossManager использует этот ключ!
            interactionRadius: 200 // Дистанция, с которой можно призвать
        });
        
        // Добавляем свечение статуе (как у тебя и было)
        obj.instance.light = {
            x: obj.instance.x,
            y: obj.instance.y - 150,
            radius: 500,
            intensity: 1.0, 
            isBossStatue: true,
            isAtlantis: true
        };
    }
    chunkObjects.push(obj.instance);
    continue; // Пропускаем стандартную логику руин для статуи
} else if (instance.isEasterStatue) {
                    instance.light = {
                        x: centerX,
                        y: centerY,
                        radius: 280,
                        intensity: 1.0, 
                        isEasterStatue: true,
                        isAtlantis: true
                    };
                } else {
                    const r = seededRandom(instance.seed);
                    instance.light = {
                        x: centerX + (r - 0.5) * instance.w * 0.3,
                        y: centerY + (seededRandom(instance.seed + 1) - 0.5) * instance.h * 0.3,
                        radius: 120 + Math.floor(r * 130), 
                        intensity: 0.4, 
                        isAmbientRuins: true, 
                        isAtlantis: true
                    };
                }

                instance.draw = function(ctx, assets) {
                    const img = assets[this.imgKey];
                    if (img && img.complete) {
                        ctx.save();
                        ctx.translate(this.x + this.w / 2, this.y + this.h);
                        ctx.rotate(this.rotation);
                        ctx.scale(this.flip, 1); 
                        
                        if (this.layer === 'bg') {
                            ctx.globalAlpha = 0.75; 
                        }

                        ctx.drawImage(img, -this.w / 2, -this.h, this.w, this.h);
                        ctx.restore();
                    }
                };

                chunkObjects.push(instance);
            }
        }
        return chunkObjects;
    }
}