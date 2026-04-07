/* src/main.js */

// Данные и конфиги
import { CONFIG } from "./data/config.js"; 

// Ядро (Core)
import { setupInput, moveLeft, moveRight } from "./core/Input.js";
import { time } from "./core/Time.js";
import { Braw as draw, assets, cameraX, cameraY } from "./core/Braw.js";
import { audioManager } from "./core/AudioManager.js";

// Сущности (Entities)
import { player } from "./entities/player/Player.js"; 
import { world } from "./world/World.js";
import { merchant } from "./entities/npcs/Merchant.js";
import { GlassesMerchant } from "./entities/npcs/GlassesMerchant.js";
import { bossManager } from "./entities/bosses/BossManager.js";
import { mobManager } from "./entities/mobs/MobManager.js";
import { petManager } from "./entities/pets/PetManager.js";

// UI (находятся в ui/ или ui/screens/)
import { ui } from "./ui/UIManager.js"; 
import { MerchantUI } from "./ui/screens/MerchantUI.js";
import { ChestUI } from "./ui/screens/ChestUI.js";
import { gameOver } from "./ui/screens/GameOver.js";
import { Inventory } from "./entities/player/Inventory.js"; // Инвентарь лежит в игроке
import { InventoryUI } from "./ui/screens/InventoryUI.js"; 

// Объекты мира
import { Sky } from "./world/sky/Sky.js";
import { BackgroundManager } from "./world/sky/BackgroundManager.js";
import { DroppedItem } from "./world/objects/DroppedItem.js";

import { SaveManager } from "./core/SaveManager.js";
import { Settings } from "./ui/screens/Settings.js";

import { residentManager } from "./entities/npcs/residents/ResidentManager.js";

import { ritualManager } from "./core/RitualManager.js";

import { biomeWeaponManager } from "./entities/weapons/BiomeWeapon.js";

import { lightingManager } from "./world/LightingManager.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// --- ФИКС ДЛЯ МОБИЛОК ---
function resize() {
    const settings = SaveManager.getSettings();
    let scale = settings.resolution || 1.0;

    // 1. Округляем размеры до целых чисел, чтобы не было дробных пикселей
    const targetWidth = Math.floor(window.innerWidth * scale);
    const targetHeight = Math.floor(window.innerHeight * scale);

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    CONFIG.width = window.innerWidth;
    CONFIG.height = window.innerHeight;
    CONFIG.groundY = CONFIG.height - 50;

    // 2. Рассчитываем точный коэффициент масштабирования
    // (потому что после Math.floor он может чуть-чуть отличаться от 0.8)
    const realScaleX = canvas.width / CONFIG.width;
    const realScaleY = canvas.height / CONFIG.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(realScaleX, realScaleY);

    // 3. Отключаем сглаживание, чтобы пиксели были четкими
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    console.log(`Рендер: ${canvas.width}x${canvas.height}, Scale: ${realScaleX.toFixed(2)}`);
}
// Инициализируем экран настроек в main.js (где-нибудь перед запуском меню)
const settingsUI = new Settings(
    () => mainMenu.showMain(), // Коллбэк для кнопки Назад
    () => resize()             // Коллбэк для применения разрешения
);

// Вызываем при запуске
resize();
// И если вдруг экран повернется (хотя мы это запретили)
window.addEventListener('resize', resize);
// ------------------------

const sky = new Sky();
const bgManager = new BackgroundManager();
const playerInventory = new Inventory();
player.inventory = playerInventory; 
window.player = player;

// Инициализируем позицию игрока ДО начала цикла
player.spawn(100);


const inventoryUI = new InventoryUI(playerInventory);
window.inventoryUI = inventoryUI; 
const chestUI = new ChestUI(inventoryUI);
window.chestUIInstance = chestUI;

// Делаем массив глобальным с самого начала, чтобы инвентарь его видел
window.droppedItems = []; 
const droppedItems = window.droppedItems; // Оставляем локальную ссылку для удобства в main.js

let moveUp = false;
let moveDown = false;

// Глобальная функция для создания предметов в мире
window.dropItemToWorld = (item) => {
    // Используем класс DroppedItem из импорта
    const newItem = new DroppedItem(player.x, player.y - 40, item);
    droppedItems.push(newItem);
    console.log(`🌍 Предмет ${item.id} (x${item.count || 1}) выброшен`);
};

// --- ВЗАИМОДЕЙСТВИЕ ---
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyF') {
        player.isFlying = !player.isFlying;
        player.velocityY = 0;
        console.log(player.isFlying ? "🚀 ПОЛЕТ ВКЛ" : "🚶 ПОЛЕТ ВЫКЛ");
    }

    if (e.code === 'KeyW' || e.code === 'ArrowUp') moveUp = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') moveDown = true;

    if (e.code === 'KeyT') {
        const targetX = -104228;
        const groundY = world.getHeight(targetX, true); 
        player.x = targetX; 
        player.y = groundY - 200; 
        player.velocityX = 0;
        player.velocityY = 0;
        if (world.chunkManager) world.chunkManager.getChunk(player.x);
    }

    if (e.code === 'KeyE') {
        if (world.chunkManager) {
            const chunkId = world.chunkManager.getChunkId(player.x);
            const chunk = world.chunkManager.chunks.get(chunkId);
            if (chunk && chunk.objects) {
                for (let obj of chunk.objects) {
                    if (obj.type === "chest") {
                        const dx = (player.x + player.size / 2) - (obj.x + obj.width / 2);
                        const dy = player.y - obj.y;
                        if (Math.sqrt(dx * dx + dy * dy) < 60) {
                            obj.instance.interact(); 
                            break; 
                        }
                    }
                }
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') moveUp = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') moveDown = false;
});

audioManager.initUnlock();
audioManager.playMusic("ambient");

merchant.spawnNearPlayer(player);
export const allNPCs = [];
const glassesMerchant = new GlassesMerchant();
glassesMerchant.spawnNearPlayer(player, 200); 
allNPCs.push(glassesMerchant);

setupInput(player);

let lastTime = performance.now();

function gameLoop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
if (gameOver.isShown) { 
        // Если игрок мертв, только рисуем экран смерти, но не считаем физику
        requestAnimationFrame(gameLoop);
        return; 
    }
    gameOver.update(); 

    if (!gameOver.isShown) {
// --- МУЗЫКА ---
        const boss = bossManager.boss;
        let targetTheme = "ambient";
        let fadeTime = 4000; // По умолчанию плавно

if (boss && boss.isAlive) {
            // Карта соответствия: ключ босса -> название файла музыки
            const bossMusicMap = {
                'desert_boss': 'desert_boss',
                'forest_boss': 'forest_boss',
                'jungle_boss': 'junglm_boss' // Точно как название твоего файла
            };
            
            // Берем нужный трек или ставим 'evil' как запасной, если для босса нет музыки
            targetTheme = bossMusicMap[bossManager.currentBossKey] || 'evil'; 
            fadeTime = 0; // Босс начался — музыка врубается резко!
        }
        else if (mobManager.isPointInDungeon(player.x + player.size / 2, player.y + player.size / 2)) {
            targetTheme = "danjunglei"; 
        } 
        else if (world.corruptionManager && world.corruptionManager.visualAlpha > 0.3) {
            targetTheme = "evil";
        }

// Если мы переключаемся С темы босса на обычную — тоже делаем это резко (победа!)
        const bossTracks = ["desert_boss", "forest_boss", "junglm_boss"];
        if (audioManager.currentMusic && bossTracks.includes(audioManager.currentMusic.dataset.key)) {
            fadeTime = 0;
        }

        audioManager.playMusic(targetTheme, fadeTime);
        bossManager.update(player);
        time.update(dt);
        sky.update(dt, time);
        
if (world.chunkManager) {
    world.chunkManager.update(dt, player); // <-- Добавляем player
}
        ritualManager.update(dt, world);
        // Обновляем порчу (для распространения биома и спавна спец-эффектов)
        if (world.corruptionManager) {
            world.corruptionManager.update(dt);
        }
        // УПРАВЛЕНИЕ
        player.velocityX = 0;
        if (player.isFlying) player.velocityY = 0;

        if (moveLeft) {
            player.velocityX = -CONFIG.speed;
            player.direction = -1;
            player.targetLookX = -4;
        } else if (moveRight) {
            player.velocityX = CONFIG.speed;
            player.direction = 1;
            player.targetLookX = 4;
        } else {
            player.direction = 0;
            player.targetLookX = 0;
        }

        if (player.isFlying) {
            if (moveUp) player.velocityY = -CONFIG.speed;
            else if (moveDown) player.velocityY = CONFIG.speed;
        }

        merchant.update(player, dt);
        allNPCs.forEach(npc => npc.update(player, dt));
        
        player.update();
        lightingManager.update(player, world, dt);
        // --- ОБНОВЛЕНИЕ ОБЪЕКТОВ МИРА (Стражи, сундуки и т.д.) ---
if (world.chunkManager) {
    const chunkId = world.chunkManager.getChunkId(player.x);
    const chunk = world.chunkManager.chunks.get(chunkId);
    
    if (chunk && chunk.objects) {
        chunk.objects.forEach(obj => {
            // Если у объекта есть метод update (как у нашего Стража)
            if (obj.instance && typeof obj.instance.update === 'function') {
                // ПЕРЕДАЕМ ИГРОКА, чтобы страж его видел
                obj.instance.update(player); 
            }
        });
    }
}
        biomeWeaponManager.update();
        
        if (window.inventoryUI) window.inventoryUI.update();
        
        mobManager.update(dt, player);
        mobManager.updateDropsLogic(dt, player, playerInventory);
        petManager.update(dt, player, mobManager.mobs, droppedItems);

        // --- ДОБАВЬ ЭТО ТУТ ---
if (residentManager) {
    // Добавляем player и dt (дельта времени)
    residentManager.update(world, audioManager, player, dt); 
}


        // КУСТЫ ЖИЗНИ
        if (world.chunkManager) {
            const chunkId = world.chunkManager.getChunkId(player.x);
            const chunk = world.chunkManager.chunks.get(chunkId);
            if (chunk && chunk.objects) {
                chunk.objects.forEach(obj => {
                    if (obj.type === "life_bush" && !obj.instance.isBroken) {
                        const fruitData = obj.instance.checkCollision(player);
                        if (fruitData) window.dropItemToWorld(fruitData);
                    }
                });
            }
        }

        // --- ОБНОВЛЕНИЕ ПРЕДМЕТОВ (ЕДИНЫЙ ЦИКЛ) ---
        for (let i = droppedItems.length - 1; i >= 0; i--) {
            const isPickedUp = droppedItems[i].update(dt, player, playerInventory, inventoryUI);
            if (isPickedUp) {
                droppedItems.splice(i, 1);
            }
        }
    
    }
    
ui.update(); 
    MerchantUI.update();
    
    // ВАЖНО: Применяем масштаб перед отрисовкой всего мира
    const scale = SaveManager.getSettings().resolution || 1.0;
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.scale(scale, scale); 

    // Очистка экрана
    ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);

    ctx.save(); // Сохраняем состояние канваса перед тряской

    // --- ДОБАВЛЯЕМ ТРЯСКУ КАМЕРЫ ---
    if (ritualManager.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * ritualManager.screenShake;
        const shakeY = (Math.random() - 0.5) * ritualManager.screenShake;
        ctx.translate(shakeX, shakeY);
    }

    // Рисуем основной мир
draw(ctx, player, world, time, bossManager.boss, sky, bgManager, petManager, mobManager, droppedItems);

lightingManager.draw(ctx, player, cameraX, cameraY, world, []);
    // Рисуем выпавшие предметы с учетом камеры
    ctx.save();
    ctx.translate(-cameraX, -cameraY);
    droppedItems.forEach(drop => drop.draw(ctx));
    ctx.restore();

    ctx.restore(); // Возвращаем канвас в норму после тряски (чтобы UI не трясся)

    MerchantUI.draw(ctx);
    requestAnimationFrame(gameLoop);
}

// Создаем функцию старта, которую вызовет меню
window.startGame = () => {
    console.log("🎮 Движок игры запущен!");
    

    player.spawn(player.x);
    lastTime = performance.now(); // Сбрасываем время перед стартом
    requestAnimationFrame(gameLoop);
};