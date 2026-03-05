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
};

// Пути к деревьям
assets.tree1.src = "./assets/svg/tree1.svg";
assets.tree2.src = "./assets/svg/tree2.svg";
assets.tree3.src = "./assets/svg/tree3.svg";
assets.tree4.src = "./assets/svg/tree4.svg";
assets.tree5.src = "./assets/svg/tree5.svg";
assets.tree6.src = "./assets/svg/tree6.svg";

// Пути к статуям 
assets.idol_desert.src = "./assets/statue/idol_desert.svg";
assets.idol_ice.src    = "./assets/statue/idol_ice.svg";
assets.idol_jungle.src = "./assets/statue/idol_jungle.svg";
assets.idol_pillar.src = "./assets/statue/idol_pillar.svg";

//  Путь к кристаллу
assets.crystal.src = "./assets/png/crystal.png";

// Пути к сундукам
assets.chestopen.src = "./assets/chest/chestopen.svg";
assets.chestunopened.src = "./assets/chest/chestunopened.svg";

// кусты жизни 
// Важно: проверь, чтобы имя файла совпадало с тем, что на диске!
assets.bush_life.src = "./assets/chest/bush of life.svg"; 
assets.fruit_life.src = "./assets/chest/fruit of life.svg";

assets.bubble.src = "./assets/chest/bubble.svg";

// Пути к оружию и артефактам
assets.mace.src = "./assets/chest/items/mace.svg";
assets.book.src = "./assets/chest/items/book.svg";
assets.broken_sword.src = "./assets/chest/items/broken sword.svg";
assets.ring.src = "./assets/chest/items/ring.svg";
assets.amulet_regeneration.src = "./assets/chest/items/Amulet of regeneration.svg";
assets.essence.src = "./assets/chest/items/essence.svg";

// Для фрукта жизни путь из твоего конфига:
assets.life_fruit.src = "./assets/chest/fruit of life.svg"; 

assets.bg_desert.src = "./assets/background/desert.png";
assets.bg_forest.src = "./assets/background/forest.png";
assets.bg_jungles.src = "./assets/background/jungles.png";
assets.bg_mountains.src = "./assets/background/Mountains.png"; // У тебя Mountains с большой буквы
assets.bg_winter.src = "./assets/background/winter.png";

assets.hook.src = "./assets/chest/items/hook.svg";

// Пути (убедись, что переименовал файлы!)
assets.jungle_chest_locked.src = "./assets/chest/items/sundukjunglei/jungle_chest_locked.svg";
assets.jungle_chest_closed.src = "./assets/chest/items/sundukjunglei/jungle_chest_closed.svg";
assets.jungle_chest_open.src = "./assets/chest/items/sundukjunglei/jungle_chest_open.svg";

assets.hand_staff.src = "./assets/chest/items/hand_staff.svg";
assets.bubble_pitomets.src = "./assets/chest/items/bubble_pitomets.svg";
assets.ghost.src = "./assets/pets/ghost/ghost.png";

assets.menu_bg.src = "./assets/png/fon_menu.png";