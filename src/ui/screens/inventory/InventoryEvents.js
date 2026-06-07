//InventoryEvents.js
import { player } from "../../../entities/player/Player.js";
import { DroppedItem } from "../../../world/objects/DroppedItem.js";
export const dragData = { 
    item: null, 
    sourceArray: null, 
    sourceIndex: -1, 
    element: null, 
    isDragging: false, 
    touchOffsetY: 0 
}; 

export class InventoryEvents {
    constructor(ui) {
        this.ui = ui; // Ссылка на главный класс InventoryUI
        
        // Привязываем контекст, чтобы this не терялся
        this.touchStartX = 0;
        this.touchStartY = 0;
    }

    initListeners() {
        // --- МЫШЬ (ПК) --- 
        document.addEventListener('mousemove', (e) => this.onMouseMove(e)); 
        document.addEventListener('mouseup', (e) => this.onMouseUp(e)); 
         
        // --- СЕНСОР (ТЕЛЕФОН) --- 
        document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false }); 
        document.addEventListener('touchend', (e) => this.onTouchEnd(e)); 
    }

    onMouseMove(e) { 
        if (!dragData.isDragging || !dragData.element) return; 
        dragData.element.style.left = (e.clientX - 16) + 'px'; 
        dragData.element.style.top = (e.clientY - 16) + 'px'; 
    } 

    onMouseUp(e) { 
        if (!dragData.isDragging) return; 
        this.handleDrop(e.clientX, e.clientY); 
    } 

    onTouchMove(e) { 
        if (!dragData.isDragging || !dragData.element) return; 
        if (e.cancelable) e.preventDefault();  
         
        const touch = e.touches[0]; 
        dragData.element.style.left = (touch.clientX - 22) + 'px'; 
        dragData.element.style.top = (touch.clientY - 22 + dragData.touchOffsetY) + 'px'; 
    } 

    onTouchEnd(e) { 
        if (!dragData.isDragging) return; 
         
        const touch = e.changedTouches[0]; 
        const dist = Math.hypot(touch.clientX - this.touchStartX, touch.clientY - this.touchStartY); 

        if (dist < 15) { 
            const slot = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.slot'); 
            const gridType = slot ? slot.dataset.gridType : 'main-grid'; 
            this.selectSlot(dragData.sourceIndex, dragData.item, gridType); 
        } else { 
            this.handleDrop(touch.clientX, touch.clientY); 
        } 
        this.cancelDrag(); 
    } 

 handleDrop(clientX, clientY) { 
    if (!dragData.isDragging) return; 
    if (dragData.element) dragData.element.style.display = 'none'; 

    const targetElement = document.elementFromPoint(clientX, clientY); 
    const slot = targetElement ? targetElement.closest('.slot') : null; 

    if (slot && slot.dataset.gridType) { 
        const targetIndex = parseInt(slot.dataset.slotIndex); 
        const gridType = slot.dataset.gridType; 
        let targetArray; 

        // Определяем, в какой массив данных мы пытаемся положить предмет
        if (gridType === 'main-grid') targetArray = this.ui.inventory.mainSlots; 
        else if (gridType === 'bubble-grid') targetArray = this.ui.inventory.bubbleSlots; 
        else if (gridType === 'currency-grid') targetArray = this.ui.inventory.currencySlots; 
        else if (gridType === 'accessory-grid') targetArray = this.ui.inventory.accessorySlots; 
        // ДОБАВЬ ЭТО: Если это сундук, берем массив из открытого сундука
        else if (gridType === 'chest-grid' && this.ui.currentChest) targetArray = this.ui.currentChest.slots;

        if (!targetArray) return this.cancelDrag();

        // Проверка ограничений слотов
// Проверка ограничений слотов
        let canPlace = true; 
if (gridType === 'bubble-grid') { 
            // 1-й слот (индекс 0): Только сам пузырь
            if (targetIndex === 0 && dragData.item.type !== 'bubble') canPlace = false; 
            
            // 2-й слот (индекс 1): Оружие для пузыря (если у тебя есть тип для обычного оружия, можешь дописать сюда проверку)
            // if (targetIndex === 1 && dragData.item.type !== 'weapon') canPlace = false;
            
            // 3-й слот (индекс 2): ТОЛЬКО оружие биомов (которое будет летать)
            if (targetIndex === 2 && dragData.item.type !== 'biome_weapon') canPlace = false; 
        }
        if (gridType === 'currency-grid' && dragData.item.type !== 'crystal') canPlace = false;
        if (canPlace) { 
            // ЛОГИКА ОБМЕНА (SWAP)
            const itemAtTarget = targetArray[targetIndex];
            
            // Кладём предмет в новый слот
            targetArray[targetIndex] = { ...dragData.item }; 
            
            // Возвращаем предмет из слота (если был) на место старого
            dragData.sourceArray[dragData.sourceIndex] = itemAtTarget ? { ...itemAtTarget } : null; 

            // Сбрасываем выделение, если переместили выбранный предмет
            if (dragData.sourceArray === this.ui.inventory.mainSlots && dragData.sourceIndex === this.ui.selectedSlotIndex) {
                this.ui.selectedSlotIndex = -1;
                this.ui.selectedItem = null;
            }
        } 
    } else { 
        this.dropItemToWorld(dragData.item, dragData.sourceArray, dragData.sourceIndex); 
    } 
    this.cancelDrag(); 
}
    dropItemToWorld(item, sourceArray, index) { 
        if (!item) return; 

        const throwDirection = player.lookDir || 1;  
        const itemData = { ...item }; 

        const newItem = new DroppedItem(player.x + player.size / 2, player.y, itemData); 
        newItem.vx = throwDirection * (3 + Math.random() * 2); 
        newItem.vy = -4 - Math.random() * 2; 

        if (!window.droppedItems) window.droppedItems = []; 
        window.droppedItems.push(newItem); 

        sourceArray[index] = null; 
         
        if (this.ui.selectedSlotIndex === index) { 
            this.ui.selectedItem = null; 
            this.ui.selectedSlotIndex = -1; 
        } 

        console.log(`🗑️ Выброшено: ${item.name}`); 
        this.ui.renderer.refresh(); 
    } 

    startDrag(item, sourceArray, index, startX, startY, touchOffsetY = 0) { 
        if (dragData.element) dragData.element.remove(); 
        this.ui.renderer.hideTooltip(); 

        dragData.item = item; 
        dragData.sourceArray = sourceArray; 
        dragData.sourceIndex = index; 
        dragData.isDragging = true; 
        dragData.touchOffsetY = touchOffsetY; 

        const dragEl = document.createElement('img'); 
        dragEl.src = item.icon || 'assets/images/items/xp.svg'; 
        dragEl.style.cssText = ` 
            position: fixed;  
            width: 44px;  
            height: 44px; 
            pointer-events: none;  
            z-index: 99999; 
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)); 
            left: ${startX - 22}px; 
            top: ${startY - 22 + touchOffsetY}px; 
            transform: scale(1.1); 
        `; 
        document.body.appendChild(dragEl); 
        dragData.element = dragEl; 
    }

    cancelDrag() { 
        if (dragData.element) dragData.element.remove(); 
        dragData.isDragging = false; 
        dragData.element = null; 
        dragData.item = null; 
        dragData.sourceArray = null; 
        
        this.ui.renderer.hideTooltip(); 
        this.ui.renderer.refresh(); 
    } 

    selectSlot(index, item, gridType) { 
        if (gridType === 'main-grid') { 
            this.ui.selectedSlotIndex = index; 
            this.ui.selectedItem = item; 
            this.ui.renderer.refresh(); 
        } 
        this.ui.renderer.updateUseButtonState(); 
    } 
}