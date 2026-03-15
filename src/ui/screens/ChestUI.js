/* ChestUI.js */
import { dragData } from "./InventoryUI.js";

export class ChestUI {
    constructor(inventoryUI) {
        this.inventoryUI = inventoryUI;
        this.isOpen = false;
        this.currentChest = null;
        this.selectedIndex = null; 
        this.createUI();
        
        window.openChestUI = (chest) => this.open(chest);
        window.closeChestUI = () => this.close();
    }

    createUI() {
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            display: none;
            flex-direction: column;
            position: fixed;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            gap: 15px;
            z-index: 1100;
            pointer-events: none;
        `;

        this.chestBox = document.createElement('div');
        this.chestBox.style.cssText = `
            padding: 15px;
            background: rgba(0, 0, 0, 0.85);
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.1);
            pointer-events: auto;
        `;

        const title = document.createElement('h3');
        title.innerText = "СУНДУК";
        title.style.cssText = `
            margin: 0 0 12px 0;
            font-size: 14px;
            color: rgba(255,255,255,0.9);
            text-align: center;
            font-weight: normal;
            text-transform: uppercase;
            letter-spacing: 2px;
        `;
        this.chestBox.appendChild(title);

        this.gridElement = document.createElement('div');
        this.gridElement.style.cssText = `
            display: grid;
            grid-template-columns: repeat(5, 32px);
            gap: 6px;
        `;
        
        for (let i = 0; i < 15; i++) {
            const slot = document.createElement('div');
            slot.style.cssText = `
                width: 32px;
                height: 32px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 4px;
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
                cursor: pointer;
                transition: all 0.2s;
            `;
            
            // Наведение (hover) через JS
            slot.onmouseover = () => { 
                if (this.selectedIndex !== i) slot.style.borderColor = "rgba(255,255,255,0.8)"; 
            };
            slot.onmouseout = () => this.refresh(); // Просто перерисовываем состояние
            
            slot.onclick = () => this.selectSlot(i);
            slot.onmousedown = (e) => this.onSlotMouseDown(e, i);
            this.gridElement.appendChild(slot);
        }
        this.chestBox.appendChild(this.gridElement);
        this.overlay.appendChild(this.chestBox);

        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = "display: flex; gap: 8px; justify-content: center; pointer-events: auto;";

        const btnBaseStyle = `
            padding: 10px 15px;
            font-size: 12px;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.3);
            background: rgba(0,0,0,0.8);
            color: white;
            cursor: pointer;
            font-weight: bold;
            text-transform: uppercase;
            transition: 0.2s;
            box-shadow: 0 4px 6px rgba(0,0,0,0.4);
        `;

        this.btnTake = document.createElement('button');
        this.btnTake.innerText = "ВЗЯТЬ";
        this.btnTake.style.cssText = btnBaseStyle;
        this.btnTake.onclick = () => this.takeSelected();

        this.btnTakeAll = document.createElement('button');
        this.btnTakeAll.innerText = "ВСЁ";
        this.btnTakeAll.style.cssText = btnBaseStyle;
        this.btnTakeAll.onclick = () => this.takeAll();

        this.btnClose = document.createElement('button');
        this.btnClose.innerText = "ЗАКРЫТЬ"; 
        this.btnClose.style.cssText = btnBaseStyle + "background: rgba(150, 30, 30, 0.8);";
        this.btnClose.onclick = () => this.close();

        [this.btnTake, this.btnTakeAll].forEach(btn => {
            btn.onmouseover = () => btn.style.background = "rgba(50,50,50,0.9)";
            btn.onmouseout = () => btn.style.background = "rgba(0,0,0,0.8)";
        });
        this.btnClose.onmouseover = () => this.btnClose.style.background = "rgba(200, 50, 50, 0.9)";
        this.btnClose.onmouseout = () => this.btnClose.style.background = "rgba(150, 30, 30, 0.8)";

        btnContainer.append(this.btnTake, this.btnTakeAll, this.btnClose);
        this.overlay.appendChild(btnContainer);
        document.body.appendChild(this.overlay);
    }

    selectSlot(index) {
        if (this.currentChest && this.currentChest.slots[index]) {
            this.selectedIndex = index;
        } else {
            this.selectedIndex = null;
        }
        this.refresh();
    }

    onSlotMouseDown(e, index) {
        const item = this.currentChest.slots[index];
        if (!item) return;

        this.selectSlot(index);

        dragData.isDragging = true;
        dragData.item = item;
        dragData.sourceArray = this.currentChest.slots;
        dragData.sourceIndex = index;
        dragData.uiRef = this.inventoryUI;

        dragData.element = document.createElement('img');
        dragData.element.src = item.icon || "assets/images/items/xp.svg";
        dragData.element.style.cssText = `
            position: fixed; width: 32px; height: 32px; 
            z-index: 9999; pointer-events: none; opacity: 0.8;
        `;
        document.body.appendChild(dragData.element);

        // Обновляем UI, чтобы предмет визуально "поднялся" (стал невидимым в слоте)
        this.refresh();
        this.inventoryUI.onMouseMove(e); 
    }

    takeSelected() {
        if (this.selectedIndex === null || !this.currentChest) return;
        const item = this.currentChest.slots[this.selectedIndex];
        if (!item) return;

        const added = this.inventoryUI.inventory.addItem(item);
        if (added) {
            this.currentChest.slots[this.selectedIndex] = null;
            this.selectedIndex = null;
            this.refresh();
            this.inventoryUI.refresh();
        }
    }

    takeAll() {
        if (!this.currentChest) return;
        let changed = false;
        for (let i = 0; i < this.currentChest.slots.length; i++) {
            const item = this.currentChest.slots[i];
            if (item) {
                const added = this.inventoryUI.inventory.addItem(item);
                if (added) {
                    this.currentChest.slots[i] = null;
                    changed = true;
                } else break; 
            }
        }
        if (changed) {
            this.selectedIndex = null;
            this.refresh();
            this.inventoryUI.refresh();
        }
    }

    open(chest) {
        this.currentChest = chest;
        this.isOpen = true;
        this.selectedIndex = null;
        this.overlay.style.display = 'flex';
        this.refresh();
    }

close() {
    this.isOpen = false;
    this.overlay.style.display = 'none';
    
    // ИСПРАВЛЕНИЕ: Прячем подсказку при закрытии сундука
    if (this.inventoryUI) {
        this.inventoryUI.hideTooltip();
    }
    
    // Также сбрасываем индекс выбора, чтобы при следующем открытии 
    // старый предмет не считался "выбранным"
    this.selectedIndex = null;

    if (this.currentChest) {
        this.currentChest.isOpen = false;
        this.currentChest = null; // Очищаем ссылку на сундук
    }
}

    refresh() {
        if (!this.currentChest) return;
        const slots = this.gridElement.children;

        for (let i = 0; i < 15; i++) {
            const item = this.currentChest.slots[i];
            const slotDiv = slots[i];
            slotDiv.innerHTML = "";

        slotDiv.onmouseenter = (e) => {
    if (item && !isDraggingThis) {
        this.inventoryUI.showTooltip(item, e);
    }
};

slotDiv.onmouseleave = () => {
    this.inventoryUI.hideTooltip();
};    

            // Стилизация выделения
            const isSelected = (this.selectedIndex === i);
            slotDiv.style.borderColor = isSelected ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.2)";
            slotDiv.style.background = isSelected ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.1)";
            slotDiv.style.boxShadow = isSelected ? "0 0 8px rgba(255, 255, 255, 0.4)" : "none";

            // Отрисовка предмета (только если мы его сейчас не перетаскиваем из этой ячейки)
            const isDraggingThis = dragData.isDragging && dragData.sourceIndex === i && dragData.sourceArray === this.currentChest.slots;
            
            if (item && !isDraggingThis) {
                this.inventoryUI.renderItemInSlot(slotDiv, item, false);
                if (slotDiv.firstChild) {
                    slotDiv.firstChild.style.pointerEvents = "none";
                }
            }
        }
    }
}