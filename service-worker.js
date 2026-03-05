
const CACHE_NAME = 'game-cache-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './cordova.js',
  './cordova_plugins.js',

  // --- ASSETS: AUDIO ---
  './assets/audio/music/ambient.mp3',
  './assets/audio/music/boss_theme.mp3',
  './assets/audio/music/CHudesenka_-_Ladoshki_76625190.mp3',
  './assets/audio/music/danjunglei.mp3',

  // --- ASSETS: BACKGROUNDS ---
  './assets/background/desert.png',
  './assets/background/forest.png',
  './assets/background/jungles.png',
  './assets/background/Mountains.png',
  './assets/background/winter.png',

  // --- ASSETS: CHEST & ITEMS ---
  './assets/chest/bubble.svg',
  './assets/chest/bush of life.svg',
  './assets/chest/chestopen.svg',
  './assets/chest/chestunopened.svg',
  './assets/chest/fruit of life.svg',
  './assets/chest/items/Amulet of regeneration.svg',
  './assets/chest/items/book.svg',
  './assets/chest/items/broken sword.svg',
  './assets/chest/items/bubble_pitomets.svg',
  './assets/chest/items/essence.svg',
  './assets/chest/items/hand_staff.svg',
  './assets/chest/items/hook.svg',
  './assets/chest/items/mace.svg',
  './assets/chest/items/poo.svg',
  './assets/chest/items/ring.svg',
  './assets/chest/items/rope.svg',
  './assets/chest/items/stone.svg',
  './assets/chest/items/threads.svg',
  './assets/chest/sundukjunglei/jungle_chest_closed.svg',
  './assets/chest/sundukjunglei/jungle_chest_locked.svg',
  './assets/chest/sundukjunglei/jungle_chest_open.svg',

  // --- ASSETS: PETS / PNG / STATUE / SVG ---
  './assets/pets/ghost/ghost.png',
  './assets/png/crystal.png',
  './assets/png/skeletjungey.png',
  './assets/statue/idol_desert.svg',
  './assets/statue/idol_ice.svg',
  './assets/statue/idol_jungle.svg',
  './assets/statue/idol_pillar.svg',
  './assets/svg/cam.svg',
  './assets/svg/cube.svg',
  './assets/svg/tree1.svg',
  './assets/svg/tree2.svg',
  './assets/svg/tree3.svg',
  './assets/svg/tree4.svg',
  './assets/svg/tree5.svg',
  './assets/svg/tree6.svg',
  './assets/svg/xp.svg',

  // --- ASSETS: VILLAGE ---
  './assets/village/consoles.svg',
  './assets/village/fire.svg',
  './assets/village/flowerbed.svg',
  './assets/village/flower_pots.svg',
  './assets/village/fountain.svg',
  './assets/village/house.svg',
  './assets/village/house_2.svg',
  './assets/village/house_3.svg',
  './assets/village/house_4.svg',
  './assets/village/kuznya.svg',
  './assets/village/tower.svg',
  './assets/village/trading_tent.svg',

  // --- SRC: CORE ---
  './src/core/AssetLoader.js',
  './src/core/audioManager.js',
  './src/core/braw.js',
  './src/core/config.js',
  './src/core/input.js',
  './src/core/lootConfig.js',
  './src/core/main.js',
  './src/core/spawnConfig.js',
  './src/core/time.js',

  // --- SRC: ENTITIES ---
  './src/entities/Bubble.js',
  './src/entities/GrapplingHook.js',
  './src/entities/player.js',
  './src/entities/bosses/Boss.js',
  './src/entities/bosses/BossManager.js',
  './src/entities/bosses/cubeBoss/CubeBoss.js',
  './src/entities/bosses/desertBoss/DesertBoss.js',
  './src/entities/bosses/desertBoss/desertpng/Desertt.png',
  './src/entities/bosses/iceBoss/icepng/ice.png',
  './src/entities/bosses/junglesBoss/JungleBoss.js',
  './src/entities/bosses/junglesBoss/JungleMinion.js',
  './src/entities/bosses/junglesBoss/junglespng/jungles.png',
  './src/entities/bosses/junglesBoss/junglespng/kyk.png',
  './src/entities/mobs/JungleSkeleton.js',
  './src/entities/mobs/Mob.js',
  './src/entities/mobs/MobManager.js',
  './src/entities/mobs/SlimeMob.js',
  './src/entities/npcs/GlassesMerchant.js',
  './src/entities/npcs/merchant.js',
  './src/entities/npcs/NPC.js',
  './src/entities/pets/GhostPet.js',
  './src/entities/pets/PetEquipment.js',
  './src/entities/pets/PetManager.js',

  // --- SRC: UI ---
  './src/ui/ChestUI.js',
  './src/ui/gameOver.js',
  './src/ui/inventory.js',
  './src/ui/InventoryUI.js',
  './src/ui/merchant_ui.js',
  './src/ui/ui.js',

  // --- SRC: WORLD ---
  './src/world/seed.js',
  './src/world/water.js',
  './src/world/world.js',
  './src/world/chunk/Chunk.js',
  './src/world/chunk/ChunkManager.js',
  './src/world/objects/Chest.js',
  './src/world/objects/ChestManager.js',
  './src/world/objects/DroppedItem.js',
  './src/world/objects/JungleChest.js',
  './src/world/objects/LifeBush.js',
  './src/world/objects/LifeBushManager.js',
  './src/world/objects/Statue.js',
  './src/world/objects/statueConfigs.js',
  './src/world/sky/BackgroundManager.js',
  './src/world/sky/Cloud.js',
  './src/world/sky/Sky.js',
  './src/world/sky/Weather.js',
  './src/world/structures/DungeonGenerator.js',
  './src/world/structures/structureBlueprints.js',
  './src/world/structures/StructureManager.js',
  './src/world/structures/VillageGenerator.js',
  './src/world/structures/village/StructureManager.js',
  './src/world/structures/village/VillageAssembler.js',
  './src/world/structures/village/villageBlueprints.js',
  './src/world/structures/village/VillageGenerator.js',
  './src/world/terrain/biomeMap.js',
  './src/world/terrain/height.js'
];



// Установка: кешируем всё
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Активация: удаляем старые кеши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Стратегия: Cache-First (сначала ищем в кеше, если нет — идем в сеть)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});