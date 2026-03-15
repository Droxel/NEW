/* src/entities/pets/PetEquipment.js */
import { player } from "../player/Player.js";

export const PetEquipment = {
    // Константы ID предметов для удобства
    ITEMS: {
        BUBBLE: 'bubble_pitomets',
        WAND: 'hand_staff'
    },

update(petManager) {
        const pet = petManager.activePet;
        if (!pet) return;

        const slots = player.inventory.bubbleSlots;

        // --- 1. ЛОГИКА ПУЗЫРЯ ---
        const bubbleItem = slots[0];
        const hasBubbleInSlot = bubbleItem && (bubbleItem.id === this.ITEMS.BUBBLE);

        if (hasBubbleInSlot) {
            pet.hasBubble = true;
        } else {
            // Снимаем пузырь ТОЛЬКО если он не был "съеден" (не Permanent)
            if (pet.hasBubble && !pet.isBubblePermanent) {
                pet.hasBubble = false;
                console.log("⚠️ Пузырь снят (пустой слот)!");
            }
        }

        // --- 2. ЛОГИКА ЖЕЗЛА/АГРЕССИИ ---
        const wandItem = slots[1];
        const hasWandInSlot = wandItem && (wandItem.id === this.ITEMS.WAND);

        // Призрак агрессивен если: он приручен ИЛИ в слоте лежит жезл
        if (pet.isTamed || hasWandInSlot) {
            pet.attackDamage = hasWandInSlot ? 2 : 1; // С жезлом урон выше
            pet.isAggressive = true;
        } else {
            pet.isAggressive = false;
        }
    }
};