// ==========================================
// ИМПОРТЫ
// ==========================================
import { CONFIG } from "./data/config.js"; 

// Ядро (Core)
import { setupInput, InputState } from "./core/InputManager.js";
import { time } from "./core/Time.js";
import { Braw as draw, assets, cameraX, cameraY, zoomLevel } from "./core/Braw.js";
import { audioManager } from "./core/AudioManager.js";
import { musicController } from "./core/MusicController.js"; 
import { SaveManager } from "./core/SaveManager.js";
import { ritualManager } from "./core/RitualManager.js";

// Сущности
import { player } from "./entities/player/Player.js"; 
import { world } from "./world/World.js";
import { merchant } from "./entities/npcs/Merchant.js";
import { GlassesMerchant } from "./entities/npcs/GlassesMerchant.js";
import { bossManager } from "./entities/bosses/BossManager.js";
import { mobManager } from "./entities/mobs/MobManager.js";
import { petManager } from "./entities/pets/PetManager.js";
import { oceanCreatureManager } from "./entities/mobs/ocean/OceanCreatureManager.js";
import { residentManager } from "./entities/npcs/residents/ResidentManager.js";
import { Inventory } from "./entities/player/Inventory.js";
import { biomeWeaponManager } from "./entities/weapons/BiomeWeapon.js";
import { CursedShip } from "./entities/ship/CursedShip.js";

// UI
import { ui } from "./ui/UIManager.js"; 
import { MerchantUI } from "./ui/screens/MerchantUI.js";
import { ChestUI } from "./ui/screens/ChestUI.js";
import { gameOver } from "./ui/screens/GameOver.js";
import { InventoryUI } from "./ui/screens/InventoryUI.js"; 
import { initZoomUI } from "./ui/components/ZoomUI.js";
import { Settings } from "./ui/screens/Settings.js";

// Объекты мира
import { Sky } from "./world/sky/Sky.js";
import { BackgroundManager } from "./world/sky/BackgroundManager.js";
import { DroppedItem } from "./world/objects/DroppedItem.js";
import { lightingManager } from "./world/LightingManager.js";
import { OCEAN, OCEAN_WATER_LEVEL } from "./world/Ocean.js";
import { weatherManager } from "./world/sky/Weather.js";
import { krakenManager } from "./entities/bosses/kraken/KrakenManager.js";
import { KrakenTriggerManager } from "./entities/bosses/kraken/KrakenTrigger.js";

import { animalManager } from "./entities/animals/AnimalManager.js";

// ==========================================
// БАЗОВАЯ НАСТРОЙКА
// ==========================================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const krakenTriggers = new KrakenTriggerManager();

function resize() {
    const settings = SaveManager.getSettings();
    let scale = settings.resolution || 1.0;
    const targetWidth = Math.floor(window.innerWidth * scale);
    const targetHeight = Math.floor(window.innerHeight * scale);

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    ctx.setTransform(1, 0, 0, 1, 0, 0); 

    const realScaleX = canvas.width / CONFIG.width;
    const realScaleY = canvas.height / CONFIG.height;
    ctx.scale(realScaleX, realScaleY);

    CONFIG.width = window.innerWidth;
    CONFIG.height = window.innerHeight;
    CONFIG.groundY = CONFIG.height - 50;

    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
}

const settingsUI = new Settings(() => mainMenu.showMain(), () => resize());
resize();
window.addEventListener('resize', resize);


// ==========================================
// ИНИЦИАЛИЗАЦИЯ МИРА И ИГРОКА
// ==========================================
const sky = new Sky();
const bgManager = new BackgroundManager();
const playerInventory = new Inventory();
player.inventory = playerInventory; 
window.player = player;
player.spawn(100);

const inventoryUI = new InventoryUI(playerInventory);
window.inventoryUI = inventoryUI; 
const chestUI = new ChestUI(inventoryUI);
window.chestUIInstance = chestUI;

window.droppedItems = []; 
const droppedItems = window.droppedItems;

window.dropItemToWorld = (item) => {
    const newItem = new DroppedItem(player.x, player.y - 40, item);
    droppedItems.push(newItem);
};

// ==========================================
// ИНИЦИАЛИЗАЦИЯ NPC И АУДИО
// ==========================================
audioManager.initUnlock();
merchant.spawnNearPlayer(player);
export const allNPCs = [];
const glassesMerchant = new GlassesMerchant();
glassesMerchant.spawnNearPlayer(player, 200); 
allNPCs.push(glassesMerchant);

setupInput(player);
initZoomUI(); 

// ==========================================
// СПАВН КОРАБЛЕЙ (КАНДИДАТОВ)
// ==========================================
function initCursedShip() {
    // Если корабль уже был активирован ранее (например, при загрузке сохранения), выходим
    if (world.cursedShip) return;

    world.cursedShipsCandidates = [];

    // Генерируем точки для левого и правого пляжа
    // Направление 1 - вправо, -1 - влево
    const spawnPoints = [
        { x: OCEAN.START - 800, dir: 1 },         // Правый пляж
        { x: -OCEAN.START + 800, dir: -1 }        // Левый пляж
    ];

    spawnPoints.forEach(point => {
        const groundY = world.getFinalHeight(point.x);
        const shipY = groundY - 200;
        const ship = new CursedShip(point.x, shipY, point.dir);
        world.cursedShipsCandidates.push(ship);
    });

    console.log(`%c⚓ Корабли расставлены по краям мира (${world.cursedShipsCandidates.length} шт.)`, "color: #00ff66");
}

initCursedShip();

// ==========================================
// ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ
// ==========================================
let lastTime = performance.now();

function gameLoop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (gameOver.isShown) { 
        gameOver.update();
        requestAnimationFrame(gameLoop);
        return; 
    }
    
    // --- 1. ОБНОВЛЕНИЕ ЛОГИКИ (UPDATE) ---
    musicController.update(player, bossManager, mobManager, world);
    
    // ДОБАВЛЕН dt СЮДА, ИНАЧЕ БОСС ЛОМАЕТСЯ И УЛЕТАЕТ
    bossManager.update(dt, player); 
    
    time.update(dt);
    sky.update(dt, time);
    
    if (world.chunkManager) {
        const loadRadius = (CONFIG.width / 2 / zoomLevel) + 500;
        world.chunkManager.update(dt, player, loadRadius); 
    }
    if (world.corruptionManager) world.corruptionManager.update(dt);

    // Управление игроком
    player.velocityX = 0;
    if (player.isFlying) player.velocityY = 0;

    if (InputState.moveLeft) {
        player.velocityX = -CONFIG.speed;
        player.direction = -1;
        player.targetLookX = -4;
    } else if (InputState.moveRight) {
        player.velocityX = CONFIG.speed;
        player.direction = 1;
        player.targetLookX = 4;
    } else {
        player.direction = 0;
        player.targetLookX = 0;
    }

    if (player.isFlying) {
        if (InputState.moveUp) player.velocityY = -CONFIG.speed;
        else if (InputState.moveDown) player.velocityY = CONFIG.speed;
    }

    // Обновление сущностей
    merchant.update(player, dt);
    allNPCs.forEach(npc => npc.update(player, dt));
    player.update();
    lightingManager.update(dt);
    animalManager.update(dt, player);

    // Обновление объектов в чанках
    if (world.chunkManager) {
        const chunk = world.chunkManager.chunks.get(world.chunkManager.getChunkId(player.x));
        if (chunk?.objects) {
            for (let i = chunk.objects.length - 1; i >= 0; i--) {
                const obj = chunk.objects[i];
                const target = obj.instance?.update ? obj.instance : (obj.update ? obj : null);
                if (target) target.update(dt, player);

                if (obj.type === "life_bush" && !obj.instance.isBroken) {
                    const fruitData = obj.instance.checkCollision(player);
                    if (fruitData) window.dropItemToWorld(fruitData);
                }

                if (obj.type === "boss_spawn_trigger") {
                    const dist = Math.sqrt((player.x - obj.x)**2 + (player.y - obj.y)**2);
                    if (dist < 600) {
                        bossManager.spawnBoss('skeleton_boss', obj.x, obj.y - 150); 
                        chunk.objects.splice(i, 1);
                    }
                }
            }
        }
    }

    // Обновление систем
    biomeWeaponManager.update();
    if (window.inventoryUI) window.inventoryUI.update();
    mobManager.update(dt, player);
    mobManager.updateDropsLogic(dt, player, playerInventory);
    petManager.update(dt, player, mobManager.mobs, droppedItems);
    oceanCreatureManager.update(dt, player, world);
    krakenManager.update(dt, player);
    weatherManager.update(dt);
    
    if (residentManager) {
        residentManager.update(world, audioManager, player, dt); 
    }

// --- ОБНОВЛЕНИЕ КОРАБЛЯ ---
    if (world.cursedShip) {
        world.cursedShip.update(dt, player);
        // ПРОВЕРЯЕМ ТРИГГЕР
        krakenTriggers.update(world.cursedShip);

        // ИСПРАВЛЕНИЕ: Если корабль полностью утонул и умер — удаляем его и переинициализируем спавнеры
        if (world.cursedShip.isDead) {
            console.log("%c⚓ Корабль окончательно затонул и удален. Перезапуск кандидатов.", "color: #ff3333");
            world.cursedShip = null; 
            
            // Вызываем заново генерацию спящих кораблей на берегах, 
            // чтобы игрок мог повторить это событие позже
            initCursedShip(); 
        }
    }
    else if (world.cursedShipsCandidates && world.cursedShipsCandidates.length > 0) {
        // Если активного корабля нет, проверяем кандидатов
        for (let i = world.cursedShipsCandidates.length - 1; i >= 0; i--) {
            const candidate = world.cursedShipsCandidates[i];
            candidate.update(dt, player);

            // Если игрок прыгнул на этот корабль (state сменился со 'sleeping')
            if (candidate.state !== 'sleeping') {
                console.log("%c🔥 КОРАБЛЬ ПРОБУЖДЕН! Остальные деспавнятся.", "background: #f00; color: #fff");
                
                // Делаем этот корабль основным
                world.cursedShip = candidate;
                
                // Очищаем массив кандидатов — остальные мгновенно исчезают
                world.cursedShipsCandidates = []; 
                break;
            }
        }
    }

    // Выпавшие предметы
    for (let i = droppedItems.length - 1; i >= 0; i--) {
        if (droppedItems[i].update(dt, player, playerInventory, inventoryUI)) {
            droppedItems.splice(i, 1);
        }
    }
    
    ui.update(); 
    MerchantUI.update();

// --- 2. СБОР СВЕТА ---
    const currentLights = [{ 
        x: player.x + player.size/2, 
        y: player.y + player.size/2, 
        radius: 180, 
        intensity: 1.0 
    }];

    // Добавляем свет от кораблей
    if (world.cursedShip) {
        currentLights.push(...world.cursedShip.getLights());
    } else if (world.cursedShipsCandidates) {
        world.cursedShipsCandidates.forEach(ship => {
            currentLights.push(...ship.getLights());
        });
    }
    if (world.chunkManager) {
        const chunk = world.chunkManager.chunks.get(world.chunkManager.getChunkId(player.x));
        chunk?.objects?.forEach(obj => {
            const light = obj.light || obj.instance?.light;
            if (light) currentLights.push({ ...light, isTorch: obj.type === "boss_torch" || obj.type === "boss_pillar" });
        });
    }

// --- 3. ОТРИСОВКА ---
    ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);

    ctx.save(); 
    
    // 1. Тряска от ритуала (если она активна)
    if (ritualManager.screenShake > 0) {
        ctx.translate(
            (Math.random() - 0.5) * ritualManager.screenShake, 
            (Math.random() - 0.5) * ritualManager.screenShake
        );
    }

    // 2. ТРЯСКА ОТ КРАКЕНА (добавляем этот блок)
    // Если Кракен воет или издает гул, смещаем весь холст на сгенерированные в update координаты
    if (krakenManager.shakeX !== 0 || krakenManager.shakeY !== 0) {
        ctx.translate(krakenManager.shakeX, krakenManager.shakeY);
    }

    // Отрисовываем весь игровой мир со смещением
    draw(
        ctx, 
        player, 
        world, 
        time, 
        bossManager.boss, 
        sky, 
        bgManager, 
        petManager, 
        mobManager,
        animalManager, 
        krakenManager, // <--- 10-й
        droppedItems,  // <--- 11-й
        currentLights  // <--- 12-й
    );

    ctx.restore(); // Возвращаем контекст в исходное состояние (чтобы UI не трясся)

    // Отрисовка света поверх всего
    // (Если хочешь, чтобы маска темноты и круги света тоже тряслись вместе с миром, 
    // перенеси этот вызов выше — внутрь блока между ctx.save() и ctx.restore())
    lightingManager.draw(ctx, player, cameraX, cameraY, world, currentLights, zoomLevel);
        
    // 3.4 Отрисовка UI
    MerchantUI.draw(ctx);
    
    requestAnimationFrame(gameLoop);
}

window.startGame = () => {
    player.spawn(player.x);
    
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
};