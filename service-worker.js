const CACHE_NAME = 'game-cache-v2'; // Обязательно меняем версию кеша, чтобы браузер обновил пути!

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './cordova.js',
  './cordova_plugins.js',
  './structure.txt',
  './version.json',

  // --- ASSETS: AUDIO ---
  './assets/audio/music/ambient.mp3',
  './assets/audio/music/boss_theme.mp3',
  './assets/audio/music/CHudesenka_-_Ladoshki_76625190.mp3',
  './assets/audio/music/danjunglei.mp3',

  // --- ASSETS: IMAGES - BIOMES ---
  './assets/images/biomes/desert.png',
  './assets/images/biomes/forest.png',
  './assets/images/biomes/jungles.png',
  './assets/images/biomes/Mountains.png',
  './assets/images/biomes/winter.png',

  // --- ASSETS: IMAGES - ENTITIES (BOSSES, MOBS, PETS) ---
  './assets/images/entities/bosses/Desertt.png',
  './assets/images/entities/bosses/ice.png',
  './assets/images/entities/bosses/jungles.png',
  './assets/images/entities/bosses/kyk.png',
  './assets/images/entities/mobs/skeletjungey.png',
  './assets/images/entities/pets/ghost.png',

  // --- ASSETS: IMAGES - ITEMS ---
  './assets/images/items/Amulet of regeneration.svg',
  './assets/images/items/book.svg',
  './assets/images/items/broken sword.svg',
  './assets/images/items/bubble.svg',
  './assets/images/items/bubble_pitomets.svg',
  './assets/images/items/crystal.png',
  './assets/images/items/essence.svg',
  './assets/images/items/fruit of life.svg',
  './assets/images/items/hand_staff.svg',
  './assets/images/items/hook.svg',
  './assets/images/items/mace.svg',
  './assets/images/items/poo.svg',
  './assets/images/items/ring.svg',
  './assets/images/items/rope.svg',
  './assets/images/items/stone.svg',
  './assets/images/items/threads.svg',
  './assets/images/items/xp.svg',

  // --- ASSETS: IMAGES - UI ---
  './assets/images/ui/cam.svg',
  './assets/images/ui/fon_menu.png',

  // --- ASSETS: IMAGES - WORLD ---
  './assets/images/world/bush of life.svg',
  './assets/images/world/chests/chestopen.svg',
  './assets/images/world/chests/chestunopened.svg',
  './assets/images/world/chests/jungle_chest_closed.svg',
  './assets/images/world/chests/jungle_chest_locked.svg',
  './assets/images/world/chests/jungle_chest_open.svg',
  './assets/images/world/statue/idol_desert.svg',
  './assets/images/world/statue/idol_ice.svg',
  './assets/images/world/statue/idol_jungle.svg',
  './assets/images/world/statue/idol_pillar.svg',
  './assets/images/world/trees/tree1.svg',
  './assets/images/world/trees/tree2.svg',
  './assets/images/world/trees/tree3.svg',
  './assets/images/world/trees/tree4.svg',
  './assets/images/world/trees/tree5.svg',
  './assets/images/world/trees/tree6.svg',
  './assets/images/world/village/consoles.svg',
  './assets/images/world/village/fire.svg',
  './assets/images/world/village/flowerbed.svg',
  './assets/images/world/village/flower_pots.svg',
  './assets/images/world/village/fountain.svg',
  './assets/images/world/village/house.svg',
  './assets/images/world/village/house_2.svg',
  './assets/images/world/village/house_3.svg',
  './assets/images/world/village/house_4.svg',
  './assets/images/world/village/kuznya.svg',
  './assets/images/world/village/tower.svg',
  './assets/images/world/village/trading_tent.svg',

  // --- SRC: ROOT ---
  './src/main.js',

  // --- SRC: CORE ---
  './src/core/AssetLoader.js',
  './src/core/AudioManager.js',
  './src/core/Braw.js',
  './src/core/GameState.js',
  './src/core/Input.js',
  './src/core/SaveManager.js',
  './src/core/Time.js',

  // --- SRC: DATA ---
  './src/data/config.js',
  './src/data/lootConfig.js',
  './src/data/progression.js',
  './src/data/spawnConfig.js',
  './src/data/statueConfigs.js',
  './src/data/structureBlueprints.js',
  './src/data/villageBlueprints.js',

  // --- SRC: ENTITIES ---
  './src/entities/bosses/Boss.js',
  './src/entities/bosses/BossManager.js',
  './src/entities/bosses/CubeBoss.js',
  './src/entities/bosses/DesertBoss.js',
  './src/entities/bosses/IceBoss.js',
  './src/entities/bosses/JungleBoss.js',
  './src/entities/bosses/JungleMinion.js',
  './src/entities/mobs/JungleSkeleton.js',
  './src/entities/mobs/Mob.js',
  './src/entities/mobs/MobManager.js',
  './src/entities/mobs/SlimeMob.js',
  './src/entities/npcs/GlassesMerchant.js',
  './src/entities/npcs/Merchant.js',
  './src/entities/npcs/NPC.js',
  './src/entities/pets/GhostPet.js',
  './src/entities/pets/PetEquipment.js',
  './src/entities/pets/PetManager.js',
  './src/entities/player/Inventory.js',
  './src/entities/player/Player.js',
  './src/entities/player/tools/Bubble.js',
  './src/entities/player/tools/GrapplingHook.js',

  // --- SRC: UI ---
  './src/ui/UIManager.js',
  './src/ui/screens/ChestUI.js',
  './src/ui/screens/GameOver.js',
  './src/ui/screens/InventoryUI.js',
  './src/ui/screens/MainMenu.js',
  './src/ui/screens/MerchantUI.js',

  // --- SRC: WORLD ---
  './src/world/Seed.js',
  './src/world/Water.js',
  './src/world/World.js',
  './src/world/chunk/Chunk.js',
  './src/world/chunk/ChunkManager.js',
  './src/world/objects/Chest.js',
  './src/world/objects/ChestManager.js',
  './src/world/objects/DroppedItem.js',
  './src/world/objects/JungleChest.js',
  './src/world/objects/LifeBush.js',
  './src/world/objects/LifeBushManager.js',
  './src/world/objects/Statue.js',
  './src/world/sky/BackgroundManager.js',
  './src/world/sky/Cloud.js',
  './src/world/sky/Sky.js',
  './src/world/sky/Weather.js',
  './src/world/structures/DungeonGenerator.js',
  './src/world/structures/StructureManager.js',
  './src/world/structures/VillageGenerator.js',
  './src/world/structures/village/VillageAssembler.js',
  './src/world/terrain/BiomeMap.js',
  './src/world/terrain/Height.js'
];

// Установка: кешируем файлы по одному (отказоустойчиво!)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Начинаем кеширование ресурсов...');
      return Promise.all(
        ASSETS_TO_CACHE.map((url) => {
          return fetch(url)
            .then((response) => {
              if (!response.ok) {
                console.warn(`[SW] Ошибка скачивания файла: ${url}`);
                return; // Игнорируем ошибку, продолжаем кешировать другие
              }
              return cache.put(url, response);
            })
            .catch((err) => {
              console.warn(`[SW] Файл не найден (опечатка?): ${url}`);
            });
        })
      );
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

// Стратегия: Cache-First + защита от крашей без интернета
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Если файл есть в кеше, отдаем его. Если нет — пытаемся скачать
      return response || fetch(event.request).catch(() => {
        console.warn(`[SW] Оффлайн. Файл не найден в кеше: ${event.request.url}`);
        // Здесь мы просто глушим ошибку, чтобы игра не вылетала с белым экраном
      });
    })
  );
});