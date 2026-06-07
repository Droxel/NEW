/* src/ui/screens/InventoryUI.js */ 
import { player } from "../../entities/player/Player.js"; 
import { dragData, InventoryEvents } from "./inventory/InventoryEvents.js"; 
import { InventoryRenderer } from "./inventory/InventoryRenderer.js";
export class InventoryUI { 
    constructor(inventory) { 
        this.inventory = inventory; 
        this.isOpen = false; 
        this.selectedSlotIndex = -1;  
        this.selectedItem = null; 

        // Инициализируем наших помощников
        this.events = new InventoryEvents(this);
        this.renderer = new InventoryRenderer(this);

        this.mobileHealBtn = document.getElementById('heal-btn'); 
        if (this.mobileHealBtn) { 
            this.mobileHealBtn.onclick = () => this.tryUsePotion(); 
        } 

        // Строим UI
        this.renderer.createUI(); 
        this.renderer.createHotbar(); 
        this.renderer.createTooltip();

        // Запускаем слушатели событий (мышь, свайпы)
        this.events.initListeners();

        window.inventoryUIInstance = this;  
    } 

    toggle() {
        this.isOpen = !this.isOpen;
        this.renderer.overlay.style.display = this.isOpen ? 'flex' : 'none';
        this.renderer.overlay.classList.toggle('active', this.isOpen);
        
        if (!this.isOpen) {
            this.renderer.hideTooltip(); 
        }

        if (this.isOpen) {
            if (window.chestUIInstance && window.chestUIInstance.isOpen) {
                window.chestUIInstance.close();
            }
            this.renderer.refresh();  
        }
    }
refresh() {
        if (this.renderer) {
            this.renderer.refresh();
        }
    }
    tryUsePotion() { 
        if (player.potionCooldown > 0) return; 

        const event = new KeyboardEvent('keydown', { 'code': 'KeyR' }); 
        document.dispatchEvent(event); 
         
        this.renderer.refreshHotbar(); 
    } 

    handleUseItem() { 
        if (dragData.isDragging) return;

        if (this.selectedItem && this.selectedItem.id === 'life_fruit') { 
            if (player.maxHp >= 20) { 
                console.log("Максимум здоровья достигнут"); 
                return;  
            } 

            player.maxHp += 1; 
            player.hp += 1;  
             
            this.inventory.consumeItem(this.selectedSlotIndex); 
             
            let updatedItem = this.inventory.mainSlots[this.selectedSlotIndex]; 
            if (updatedItem && updatedItem.count <= 0) {
                this.inventory.mainSlots[this.selectedSlotIndex] = null;
                updatedItem = null;
            }
             
            if (!updatedItem) { 
                this.selectedItem = null; 
                this.selectedSlotIndex = -1; 
                this.renderer.hideTooltip(); 
            } else { 
                this.selectedItem = updatedItem; 
            } 
             
            this.renderer.refresh(); 
            console.log("💖 Максимальное здоровье увеличено!"); 
        } 
    } 

    update() { 
        if (player.potionCooldown >= 0 || this.isOpen) { 
            this.renderer.refreshHotbar(); 
        } 
    } 
}