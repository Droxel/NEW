// ЗАГРУЗКА АССЕТОВ

export const assets = {
    tree1: new Image(),
    tree2: new Image(),
    tree3: new Image(),
    tree4: new Image(),
    tree5: new Image(),
    tree6: new Image(),
    
    //  СТАТУИ 
    idol_desert: new Image(),
    idol_ice: new Image(),
    idol_jungle: new Image(),
    idol_pillar: new Image(),

//  ДОБАВЛЯЕМ КРИСТАЛЛ
    crystal: new Image(),

    // --- НОВЫЕ АССЕТЫ СУНДУКОВ ---
    chestopen: new Image(),
    chestunopened: new Image(),
    
    bush_life: new Image(),  // Куст
    fruit_life: new Image(), // Фрукт (сердечко)

    bubble: new Image(),
// --- ПРЕДМЕТЫ (для отображения в пузыре и мире) ---
    mace: new Image(),
    book: new Image(),
    broken_sword: new Image(),
    ring: new Image(),
    amulet_regeneration: new Image(),
    essence: new Image(),
    life_fruit: new Image(), // Тот самый Фрукт Жизни
    
    bubble: new Image(),

    // --- НОВЫЕ АССЕТЫ ФОНОВ ---
    bg_desert: new Image(),
    bg_forest: new Image(),
    bg_jungles: new Image(),
    bg_mountains: new Image(),
    bg_winter: new Image(),
    
    hook: new Image(),

  // --- НОВЫЕ АССЕТЫ ДЖУНГЛЕВЫХ СУНДУКОВ ---
    jungle_chest_locked: new Image(),
    jungle_chest_closed: new Image(),
    jungle_chest_open: new Image(),  

    hand_staff: new Image(),
    bubble_pitomets: new Image(),
    ghost: new Image(),

    menu_bg: new Image(),

    boss_desert: new Image(),
    boss_ice: new Image(),
    boss_jungle: new Image(),
    boss_kyk: new Image(),
};

// Деревья (world/trees/)
assets.tree1.src = "../../assets/images/world/trees/tree1.svg";
assets.tree2.src = "../../assets/images/world/trees/tree2.svg";
assets.tree3.src = "../../assets/images/world/trees/tree3.svg";
assets.tree4.src = "../../assets/images/world/trees/tree4.svg";
assets.tree5.src = "../../assets/images/world/trees/tree5.svg";
assets.tree6.src = "../../assets/images/world/trees/tree6.svg";

// Статуи (world/statue/)
assets.idol_desert.src = "../../assets/images/world/statue/idol_desert.svg";
assets.idol_ice.src    = "../../assets/images/world/statue/idol_ice.svg";
assets.idol_jungle.src = "../../assets/images/world/statue/idol_jungle.svg";
assets.idol_pillar.src = "../../assets/images/world/statue/idol_pillar.svg";

// Предметы (ВНИМАНИЕ: исправлены пробелы в названиях файлов)
assets.crystal.src             = "../../assets/images/items/crystal.png";
assets.mace.src                = "../../assets/images/items/mace.svg";
assets.book.src                = "../../assets/images/items/book.svg";
assets.broken_sword.src        = "../../assets/images/items/broken sword.svg"; // Пробел важен
assets.ring.src                = "../../assets/images/items/ring.svg";
assets.amulet_regeneration.src = "../../assets/images/items/Amulet of regeneration.svg"; // Пробел и регистр
assets.essence.src             = "../../assets/images/items/essence.svg";
assets.fruit_life.src          = "../../assets/images/items/fruit of life.svg"; 
assets.life_fruit.src          = "../../assets/images/items/fruit of life.svg"; 
assets.bubble.src              = "../../assets/images/items/bubble.svg";
assets.hook.src                = "../../assets/images/items/hook.svg";
assets.hand_staff.src          = "../../assets/images/items/hand_staff.svg";
assets.bubble_pitomets.src     = "../../assets/images/items/bubble_pitomets.svg";

// Мир и сундуки (world/...)
assets.bush_life.src           = "../../assets/images/world/bush of life.svg"; // Пробелы
assets.chestopen.src           = "../../assets/images/world/chests/chestopen.svg";
assets.chestunopened.src       = "../../assets/images/world/chests/chestunopened.svg";
assets.jungle_chest_locked.src = "../../assets/images/world/chests/jungle_chest_locked.svg";
assets.jungle_chest_closed.src = "../../assets/images/world/chests/jungle_chest_closed.svg";
assets.jungle_chest_open.src   = "../../assets/images/world/chests/jungle_chest_open.svg";

// Фоны (biomes/)
assets.bg_desert.src    = "../../assets/images/biomes/desert.png";
assets.bg_forest.src    = "../../assets/images/biomes/forest.png";
assets.bg_jungles.src   = "../../assets/images/biomes/jungles.png";
assets.bg_mountains.src = "../../assets/images/biomes/Mountains.png"; // Большая M
assets.bg_winter.src    = "../../assets/images/biomes/winter.png";

// Сущности и UI
assets.ghost.src   = "../../assets/images/entities/pets/ghost.png";
assets.menu_bg.src = "../../assets/images/ui/fon_menu.png";

assets.boss_desert.src = "../../assets/images/entities/bosses/Desertt.png";
assets.boss_ice.src    = "../../assets/images/entities/bosses/ice.png";
assets.boss_jungle.src = "../../assets/images/entities/bosses/jungles.png";
assets.boss_kyk.src    = "../../assets/images/entities/bosses/kyk.png";