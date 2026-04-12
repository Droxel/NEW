// Данные и конфиги
import { CONFIG } from "./data/config.js"; 

// Ядро (Core)
// ВАЖНО: Импортируем из нового InputManager
import { setupInput, InputState } from "./core/InputManager.js";
import { time } from "./core/Time.js";
import { Braw as draw, assets, cameraX, cameraY } from "./core/Braw.js";
import { audioManager } from "./core/AudioManager.js";
import { musicController } from "./core/MusicController.js"; 

// Сущности
import { player } from "./entities/player/Player.js"; 
import { world } from "./world/World.js";
import { merchant } from "./entities/npcs/Merchant.js";
import { GlassesMerchant } from "./entities/npcs/GlassesMerchant.js";
import { bossManager } from "./entities/bosses/BossManager.js";
import { mobManager } from "./entities/mobs/MobManager.js";
import { petManager } from "./entities/pets/PetManager.js";

// UI
import { ui } from "./ui/UIManager.js"; 
import { MerchantUI } from "./ui/screens/MerchantUI.js";
import { ChestUI } from "./ui/screens/ChestUI.js";
import { gameOver } from "./ui/screens/GameOver.js";
import { Inventory } from "./entities/player/Inventory.js";
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

// --- РЕСАЙЗ И НАСТРОЙКИ ---
function resize() {
    const settings = SaveManager.getSettings();
    let scale = settings.resolution || 1.0;
    const targetWidth = Math.floor(window.innerWidth * scale);
    const targetHeight = Math.floor(window.innerHeight * scale);

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    CONFIG.width = window.innerWidth;
    CONFIG.height = window.innerHeight;
    CONFIG.groundY = CONFIG.height - 50;

    const realScaleX = canvas.width / CONFIG.width;
    const realScaleY = canvas.height / CONFIG.height;
    ctx.scale(realScaleX, realScaleY);

    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
}

const settingsUI = new Settings(() => mainMenu.showMain(), () => resize());
resize();
window.addEventListener('resize', resize);

// --- ИНИЦИАЛИЗАЦИЯ МИРА ---
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

// Глобальная функция выброса предметов
window.dropItemToWorld = (item) => {
    const newItem = new DroppedItem(player.x, player.y - 40, item);
    droppedItems.push(newItem);
};

// --- СТАРТ АУДИО И NPC ---
audioManager.initUnlock();
merchant.spawnNearPlayer(player);
export const allNPCs = [];
const glassesMerchant = new GlassesMerchant();
glassesMerchant.spawnNearPlayer(player, 200); 
allNPCs.push(glassesMerchant);

// Инициализация нашей новой системы управления
setupInput(player);

let lastTime = performance.now();

// --- ГЛАВНЫЙ ЦИКЛ ---
function gameLoop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (gameOver.isShown) { 
        requestAnimationFrame(gameLoop);
        return; 
    }
    gameOver.update(); 

    if (!gameOver.isShown) {
        musicController.update(player, bossManager, mobManager, world);

        bossManager.update(player);
        time.update(dt);
        sky.update(dt, time);
        
        if (world.chunkManager) world.chunkManager.update(dt, player);
        ritualManager.update(dt, world);
        if (world.corruptionManager) world.corruptionManager.update(dt);

        // --- Управление игроком (используем InputState) ---
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

        merchant.update(player, dt);
        allNPCs.forEach(npc => npc.update(player, dt));
        player.update();
        lightingManager.update(dt);

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

        biomeWeaponManager.update();
        if (window.inventoryUI) window.inventoryUI.update();
        mobManager.update(dt, player);
        mobManager.updateDropsLogic(dt, player, playerInventory);
        petManager.update(dt, player, mobManager.mobs, droppedItems);

        if (residentManager) {
            residentManager.update(world, audioManager, player, dt); 
        }

        // Выпавшие предметы
        for (let i = droppedItems.length - 1; i >= 0; i--) {
            if (droppedItems[i].update(dt, player, playerInventory, inventoryUI)) {
                droppedItems.splice(i, 1);
            }
        }
    }
    
    ui.update(); 
    MerchantUI.update();
    
    // --- ОТРИСОВКА ---
    const resScale = SaveManager.getSettings().resolution || 1.0;
    ctx.scale(resScale, resScale); 
    ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);

    ctx.save();
    if (ritualManager.screenShake > 0) {
        ctx.translate((Math.random()-0.5)*ritualManager.screenShake, (Math.random()-0.5)*ritualManager.screenShake);
    }

    // Сбор источников света
    const currentLights = [{ x: player.x + player.size/2, y: player.y + player.size/2, radius: 180, intensity: 1.0 }];
    if (world.chunkManager) {
        const chunk = world.chunkManager.chunks.get(world.chunkManager.getChunkId(player.x));
        chunk?.objects?.forEach(obj => {
            const light = obj.light || obj.instance?.light;
            if (light) currentLights.push({ ...light, isTorch: obj.type === "boss_torch" || obj.type === "boss_pillar" });
        });
    }
    if (bossManager.boss?.isAlive && bossManager.boss.getLights) {
        currentLights.push(...(bossManager.boss.getLights() || []));
    }

    draw(ctx, player, world, time, bossManager.boss, sky, bgManager, petManager, mobManager, droppedItems);
    lightingManager.draw(ctx, player, cameraX, cameraY, world, currentLights);

    ctx.save();
    ctx.translate(-cameraX, -cameraY);
    droppedItems.forEach(drop => drop.draw(ctx));
    ctx.restore();

    ctx.restore();
    MerchantUI.draw(ctx);
    requestAnimationFrame(gameLoop);
}

window.startGame = () => {
    player.spawn(player.x);
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
};