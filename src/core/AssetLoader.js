// ЗАГРУЗКА АССЕТОВ

export const assets = {
    tree1: new Image(),
    tree2: new Image(),
    tree3: new Image(),
    tree4: new Image(),
    tree5: new Image(),
    tree6: new Image(),
    distorted_tree: new Image(),

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
    bg_village: new Image(),

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

    // --- ДЕРЕВНЯ ---
    village_tower: new Image(),
    village_house1: new Image(),
    village_house2: new Image(),
    village_house3: new Image(),
    village_house4: new Image(),
    village_kuznya: new Image(),
    village_fire: new Image(),
    village_fountain: new Image(),
    village_pots: new Image(),
    village_tent: new Image(),
    village_flowerbed: new Image(),
    village_consoles: new Image(),

    // --- ГИГАНТ ---
    giant_head: new Image(),
    giant_body: new Image(),
    giant_arm: new Image(),
    giant_fist: new Image(),

    a_desert: new Image(),
    a_forest: new Image(),
    a_glazed: new Image(),
    a_jungli: new Image(),

    // Ядра (Cores)
    core_desert: new Image(),
    core_jungle: new Image(),
    core_forest: new Image(),
    core_ice:    new Image(),

    // Оружие (Weapons)
    wpn_desert: new Image(),
    wpn_jungle: new Image(),
    wpn_forest: new Image(),
    wpn_ice:    new Image(),

    jungle_guard: new Image(),

};


// Деревья (world/trees/)
assets.tree1.src = "../../assets/images/world/trees/tree1.svg";
assets.tree2.src = "../../assets/images/world/trees/tree2.svg";
assets.tree3.src = "../../assets/images/world/trees/tree3.svg";
assets.tree4.src = "../../assets/images/world/trees/tree4.svg";
assets.tree5.src = "../../assets/images/world/trees/tree5.svg";
assets.tree6.src = "../../assets/images/world/trees/tree6.svg";
assets.distorted_tree.src = "../../assets/images/world/trees/distorted_tree.svg";

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
assets.bg_village.src = "../../assets/images/biomes/village.png";
// Сущности и UI
assets.ghost.src   = "../../assets/images/entities/pets/ghost.png";
assets.menu_bg.src = "../../assets/images/ui/fon_menu.png";

assets.boss_desert.src = "../../assets/images/entities/bosses/Desertt.png";
assets.boss_ice.src    = "../../assets/images/entities/bosses/ice.png";
assets.boss_jungle.src = "../../assets/images/entities/bosses/jungles.png";
assets.boss_kyk.src    = "../../assets/images/entities/bosses/kyk.png";

assets.village_tower.src = "../../assets/images/world/village/tower.svg";
assets.village_house1.src = "../../assets/images/world/village/house.svg";
assets.village_house2.src = "../../assets/images/world/village/house_2.svg";
assets.village_house3.src = "../../assets/images/world/village/house_3.svg";
assets.village_house4.src = "../../assets/images/world/village/house_4.svg";
assets.village_kuznya.src = "../../assets/images/world/village/kuznya.svg";
assets.village_fire.src = "../../assets/images/world/village/fire.svg";
assets.village_fountain.src = "../../assets/images/world/village/fountain.svg";
assets.village_pots.src = "../../assets/images/world/village/flower_pots.svg";
assets.village_tent.src = "../../assets/images/world/village/trading_tent.svg";

// Гигант (entities/mobs/)
assets.giant_head.src = "../../assets/images/entities/mobs/head_giant.png";
assets.giant_body.src = "../../assets/images/entities/mobs/body_giant.png";
assets.giant_arm.src  = "../../assets/images/entities/mobs/arm_giant.png";
assets.giant_fist.src = "../../assets/images/entities/mobs/fist.png";

assets.a_desert.src = "../../assets/images/world/altars/a_desert.svg";
assets.a_forest.src = "../../assets/images/world/altars/a_forest.svg";
assets.a_glazed.src = "../../assets/images/world/altars/a_glazed.svg";
assets.a_jungli.src = "../../assets/images/world/altars/a_jungli.svg";

// Ядра (используем иконку эссенции или свои уникальные)
assets.core_desert.src = "../../assets/images/items/essence_desert.svg";
assets.core_jungle.src = "../../assets/images/items/essence_jungle.svg";
assets.core_forest.src = "../../assets/images/items/essence_forest.svg";
assets.core_ice.src    = "../../assets/images/items/essence_ice.svg";

// Оружие
assets.wpn_desert.src = "assets/images/items/desert_knife.svg";
assets.wpn_jungle.src = "../../assets/images/items/fang_jungles.svg";
assets.wpn_forest.src = "../../assets/images/items/wooden_mallet.svg";
assets.wpn_ice.src    = "../../assets/images/items/ice_shard.svg";

assets.jungle_guard.src = "../../assets/images/entities/mobs/guard.png";
