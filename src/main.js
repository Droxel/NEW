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

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// --- ФИКС ДЛЯ МОБИЛОК ---
function resize() {
    // Устанавливаем размер канваса равным размеру экрана
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Обновляем конфиг, чтобы другие скрипты знали новые границы
    CONFIG.width = canvas.width;
    CONFIG.height = canvas.height;
    CONFIG.groundY = canvas.height - 50;
}

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
        if (boss && boss.isAlive) {
            targetTheme = "boss_theme";
        } else if (mobManager.isPointInDungeon(player.x + player.size / 2, player.y + player.size / 2)) {
            targetTheme = "danjunglei"; 
        }

        if (!audioManager.currentMusic || audioManager.currentMusic.dataset.key !== targetTheme) {
            audioManager.playMusic(targetTheme);
        }

        bossManager.update(player);
        time.update(dt);
        sky.update(dt, time);

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
        
        if (window.inventoryUI) window.inventoryUI.update();
        
        mobManager.update(dt, player);
        mobManager.updateDropsLogic(dt, player, playerInventory);
        petManager.update(dt, player, mobManager.mobs, droppedItems);

        // КОЛЛИЗИИ С МОБАМИ
        mobManager.mobs.forEach(mob => {
            if (!mob.isDead && !player.isFlying &&
                player.x < mob.x + mob.width &&
                player.x + player.size > mob.x &&
                player.y < mob.y + mob.height &&
                player.y + player.size > mob.y
            ) {
                if (player.velocityY > 0 && player.y + player.size < mob.y + mob.height * 0.5) {
                    mob.takeDamage(1);
                    player.velocityY = -8;
                } else {
                    player.takeDamage(mob.damage || 1); 
                    const dir = Math.sign(player.x - mob.x);
                    player.velocityX = dir * 10;
                    player.velocityY = -5;
                }
            }
        });

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
    
    // --- ОТРИСОВКА ---
    ui.update(); 
    MerchantUI.update();
    
    // Рисуем основной мир
    draw(ctx, player, world, time, bossManager.boss, sky, bgManager, petManager, mobManager, droppedItems);

    // Рисуем выпавшие предметы с учетом камеры
    ctx.save();
    ctx.translate(-cameraX, -cameraY);
    droppedItems.forEach(drop => drop.draw(ctx));
    ctx.restore();

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
