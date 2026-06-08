/* src/data/lootConfig.js */
import { hash, WORLD_SEED } from "../world/Seed.js";


export const BIOME_CORES = {
    'desert_boss': { id: 'core_desert', name: 'Ядро Пустыни', icon: 'assets/images/items/core_desert.svg', type: 'core' },
    'jungle_boss': { id: 'core_jungle', name: 'Ядро Джунглей', icon: 'assets/images/items/core_jungles.svg', type: 'core' },
    // ЗАМЕНИ КЛЮЧ ТУТ:
    'forest_boss': { id: 'core_forest', name: 'Ядро Леса', icon: 'assets/images/items/core_forest.svg', type: 'core' }, 
    'ice_boss':    { id: 'core_ice', name: 'Ядро Льдов', icon: 'assets/images/items/core_ice.svg', type: 'core' }
};

export const BIOME_WEAPONS = {
    'desert_boss': { id: 'wpn_desert', name: 'Песчаный Резак', icon: 'assets/images/items/desert_knife.svg', type: 'biome_weapon', damage: 15 },
    'jungle_boss': { id: 'wpn_jungle', name: 'Лоза Хранителя', icon: 'assets/images/items/fang_jungles.svg', type: 'biome_weapon', damage: 18 },
    'forest_boss': { id: 'wpn_forest', name: 'Древесный Молот', icon: 'assets/images/items/wooden_mallet.svg', type: 'biome_weapon', damage: 12 }, 
    'ice_boss':    { id: 'wpn_ice', name: 'Ледяной Осколок', icon: 'assets/images/items/book.svg', type: 'biome_weapon', damage: 20 }
};
// 1. Создаем предмет
export const AIR_BUBBLE_ACCESSORY = {
    id: 'air_bubble_acc',
    name: 'Воздушный Пузырь',
    description: 'Окутывает голову и позволяет дышать под водой.',
    icon: 'assets/images/items/air_bubble.svg',
    maxCount: 1,
    type: 'accessory', // Важно! Указываем тип для инвентаря
    accType: 'water_breathing' // Доп. тип на будущее для разных пузырей
};
// Добавляем определение Фрукта Жизни
export const LIFE_FRUIT_ITEM = { 
    id: 'life_fruit', 
    name: 'Фрукт Жизни', 
    description: 'Увеличивает макс. здоровье', 
    icon: 'assets/images/items/fruit of life.svg', 
    maxCount: 99,
    type: 'consumable', 
    value: 5 
};

export const TAMING_STAFF_ITEM = {
    id: 'taming_staff',
    name: 'Посох Приручения',
    description: 'Издает ауру, притягивающую призраков',
    icon: 'assets/images/items/hand_staff.svg',
    maxCount: 1,
    type: 'pet_tool'
};

export const PET_BUBBLE_ITEM = {
    id: 'pet_bubble',
    name: 'Эссенциальный Пузырь',
    description: 'Защитит твоего питомца от воды',
    icon: 'assets/images/items/bubble_pitomets.svg',
    maxCount: 1,
    type: 'pet_item'
};

// 1. СПИСКИ ПРЕДМЕТОВ
const RARE_LOOT = [
    { id: 'amulet_regeneration', name: 'Амулет регенерации', description: 'Восстанавливает здоровье', icon: 'assets/images/items/Amulet of regeneration.svg' },
    { id: 'ring', name: 'Старое кольцо', description: 'Блестяшка', icon: 'assets/images/items/ring.svg' },
    { id: 'mace', name: 'Булава', description: 'Тяжелый удар', icon: 'assets/images/items/mace.svg', type: 'weapon', damage: 3 },
    { id: 'book', name: 'Книга Заклинаний', description: 'Магический урон', icon: 'assets/images/items/book.svg', type: 'weapon', damage: 4 },
    { id: 'essence', name: 'Эссенция', description: 'Магия в чистом виде', icon: 'assets/images/items/essence.svg', count: 2 } 
];

const COMMON_LOOT = [
    { id: 'potion_hp', name: 'Зелье Опыта', icon: 'assets/images/items/xp.svg', weight: 40, maxCount: 3 },
    { id: 'crystal', name: 'Кристалл', icon: 'assets/images/items/crystal.png', weight: 60, maxCount: 12 },
    { id: 'threads', name: 'Нитки', icon: 'assets/images/items/threads.svg', weight: 50, maxCount: 5 },
    { id: 'broken_sword', name: 'Сломанный меч', icon: 'assets/images/items/broken sword.svg', weight: 30, maxCount: 1, type: 'weapon', damage: 2 },
    { id: 'stone', name: 'Камень', icon: 'assets/images/items/stone.svg', weight: 70, maxCount: 15 },
    { id: 'poo', name: 'Кучка', icon: 'assets/images/items/poo.svg', weight: 15, maxCount: 1 }
];

// Функция перемешивания массива
function shuffleArray(array, seed) {
    const shuffled = [...array]; 
    for (let i = shuffled.length - 1; i > 0; i--) {
        const randomVal = hash(seed + i * 123.45); 
        const j = Math.floor(randomVal * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Выбор обычного предмета по весу
function pickWeightedItem(itemList, seed) {
    const totalWeight = itemList.reduce((sum, item) => sum + item.weight, 0);
    let randomValue = hash(seed) * totalWeight;
    for (const item of itemList) {
        randomValue -= item.weight;
        if (randomValue <= 0) return { ...item };
    }
    return { ...itemList[0] };
}

export function generateChestLoot(chestIndex, type = "common") {
    const slots = new Array(15).fill(null);
    const loot = [];

    // --- ЛОГИКА ТЕРРАРИИ ДЛЯ РЕДКИХ ПРЕДМЕТОВ ---
    const poolSize = RARE_LOOT.length;
    const cycleIndex = Math.floor(chestIndex / poolSize); 
    const cycleSeed = WORLD_SEED + (cycleIndex * 999);
    const shuffledRare = shuffleArray(RARE_LOOT, cycleSeed);
    const safeIndex = Math.abs(chestIndex % poolSize);
    
    let rareItemTemplate = shuffledRare[safeIndex];
    if (!rareItemTemplate) rareItemTemplate = RARE_LOOT[0];

    loot.push({ 
        ...rareItemTemplate, 
        count: rareItemTemplate.count || 1, 
        tier: 'rare' 
    });

    // --- ОБЫЧНЫЙ МУСОР ---
    const baseSeed = hash(chestIndex * 77.7 + WORLD_SEED);
    const extraCount = Math.floor(hash(baseSeed) * 4) + 2; 

    for (let i = 0; i < extraCount; i++) {
        const itemSeed = baseSeed + (i + 1) * 55.5;
        const randomItem = pickWeightedItem(COMMON_LOOT, itemSeed);
        const lootItem = { ...randomItem, tier: 'common' };

        if (lootItem.maxCount > 1) {
            lootItem.count = Math.floor(hash(itemSeed * 0.5) * lootItem.maxCount) + 1;
        } else {
            lootItem.count = 1;
        }

        if (!loot.find(l => l.id === lootItem.id)) {
            loot.push(lootItem);
        }
    }

    // --- РАСКЛАДЫВАЕМ ПО СЛОТАМ ---
    loot.forEach((item, index) => {
        let slotIndex;
        let attempt = 0;
        do {
            slotIndex = Math.floor(hash(baseSeed + index + attempt) * 15);
            attempt++;
        } while (slots[slotIndex] !== null && attempt < 50);
        
        if (slots[slotIndex] !== null) {
            slotIndex = slots.findIndex(s => s === null);
        }

        if (slotIndex !== -1) {
            slots[slotIndex] = item;
        }
    });

// --- 100% ГАРАНТИРОВАННЫЕ ПРЕДМЕТЫ ---
    
    const addItemToSlot = (item) => {
        const slotIndex = slots.findIndex(s => s === null);
        if (slotIndex !== -1) slots[slotIndex] = { ...item, count: item.count || 1 };
    };

    // 1. Если это джунглевый сундук
    if (type === "jungle") {
        addItemToSlot(TAMING_STAFF_ITEM);
        addItemToSlot(PET_BUBBLE_ITEM);
    }

    // 2. ДОБАВЛЯЕМ КРЮК-КОШКУ ВО ВСЕ СУНДУКИ (и обычные, и джунглевые)
    // Если хочешь ТОЛЬКО в обычные, напиши: if (type === "common")
    const hookItem = { 
        id: 'hook', 
        name: 'Крюк-кошка', 
        icon: 'assets/images/items/hook.svg',
        type: 'hook',
        count: 1
    };
    addItemToSlot(hookItem);

    // 3. Твой тестовый пузырь (тоже во всех сундуках сейчас)
    const bubbleItem = { 
        id: 'magic_bubble', 
        name: 'Волшебный пузырь', 
        description: 'Летает и атакует твоим оружием!', 
        icon: 'assets/images/items/bubble.svg',
        type: 'bubble',
        count: 1 
    };
    addItemToSlot(bubbleItem);
// НОВЫЙ АКСЕССУАР ВОЗДУШНОГО ПУЗЫРЯ (ТЕСТ)
    addItemToSlot(AIR_BUBBLE_ACCESSORY);
    return slots;
}