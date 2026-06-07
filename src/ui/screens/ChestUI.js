/* ChestUI.js */
import { dragData } from "./inventory/InventoryEvents.js";

export class ChestUI {
    constructor(inventoryUI) {
        this.inventoryUI = inventoryUI;
        this.isOpen = false;
        this.currentChest = null;
        this.selectedIndex = null;
        
        // Создаем стили один раз при инициализации
        this.injectStyles();
        this.createUI();

        window.openChestUI = (chest) => this.open(chest);
        window.closeChestUI = () => this.close();
    }

    injectStyles() {
        if (document.getElementById('chest-ui-styles')) return;
        const style = document.createElement('style');
        style.id = 'chest-ui-styles';
        style.innerHTML = `
            .chest-overlay { display: none; flex-direction: column; position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%); gap: 15px; z-index: 1100; pointer-events: none; }
            .chest-box { padding: 15px; background: rgba(0, 0, 0, 0.85); border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); pointer-events: auto; }
            .chest-grid { display: grid; grid-template-columns: repeat(5, 32px); gap: 6px; }
            .chest-slot { width: 32px; height: 32px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; display: flex; justify-content: center; align-items: center; position: relative; cursor: pointer; transition: border-color 0.2s; }
            .chest-slot:hover { border-color: rgba(255,255,255,0.8); }
            .chest-slot.selected { border-color: #ffcc00 !important; background: rgba(255, 204, 0, 0.1); }
            .btn-base { padding: 10px 15px; font-size: 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.8); color: white; cursor: pointer; font-weight: bold; text-transform: uppercase; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.4); }
            .btn-base:hover { background: rgba(50,50,50,0.9); }
            .btn-close { background: rgba(150, 30, 30, 0.8); }
            .btn-close:hover { background: rgba(200, 50, 50, 0.9); }
        `;
        document.head.appendChild(style);
    }

    createUI() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'chest-overlay';

        this.chestBox = document.createElement('div');
        this.chestBox.className = 'chest-box';

        const title = document.createElement('h3');
        title.innerText = "СУНДУК";
        title.style.cssText = "margin: 0 0 12px 0; font-size: 14px; color: white; text-align: center; letter-spacing: 2px; font-weight: normal;";
        
        this.gridElement = document.createElement('div');
        this.gridElement.className = 'chest-grid';

        // Используем делегирование событий
        this.gridElement.onclick = (e) => {
            const slot = e.target.closest('.chest-slot');
            if (slot) this.selectSlot(parseInt(slot.dataset.index));
        };

        this.gridElement.onmousedown = (e) => {
            const slot = e.target.closest('.chest-slot');
            if (slot) this.onSlotMouseDown(e, parseInt(slot.dataset.index));
        };

for (let i = 0; i < 15; i++) {
    const slot = document.createElement('div');
    slot.className = 'chest-slot'; // Твой стиль для сундука
    slot.dataset.index = i;

    // ДОБАВЛЯЕМ СТРУКТУРУ ДЛЯ РЕНДЕРЕРА
    const img = document.createElement('img');
    img.className = 'slot-img';
    img.style.display = 'none';

    const countDiv = document.createElement('div');
    countDiv.className = 'slot-count';

    const timerDiv = document.createElement('div');
    timerDiv.className = 'slot-timer';
    timerDiv.style.display = 'none';

    slot.appendChild(img);
    slot.appendChild(countDiv);
    slot.appendChild(timerDiv);

    this.gridElement.appendChild(slot);
}

        this.chestBox.append(title, this.gridElement);
        this.overlay.appendChild(this.chestBox);

        // Кнопки
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = "display: flex; gap: 8px; justify-content: center; pointer-events: auto;";

        this.btnTake = this.createBtn("ВЗЯТЬ", () => this.takeSelected());
        this.btnTakeAll = this.createBtn("ВСЁ", () => this.takeAll());
        this.btnClose = this.createBtn("ЗАКРЫТЬ", () => this.close(), "btn-close");

        btnContainer.append(this.btnTake, this.btnTakeAll, this.btnClose);
        this.overlay.appendChild(btnContainer);
        document.body.appendChild(this.overlay);
    }

    createBtn(text, handler, extraClass = "") {
        const btn = document.createElement('button');
        btn.className = `btn-base ${extraClass}`;
        btn.innerText = text;
        btn.onclick = handler;
        return btn;
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

    dragData.element = document.createElement('img');
    dragData.element.src = item.icon || "assets/images/items/xp.svg";
    dragData.element.style.cssText = `
        position: fixed; width: 32px; height: 32px; 
        z-index: 9999; pointer-events: none; opacity: 0.8;
    `;
    document.body.appendChild(dragData.element);

    this.refresh();
    // ИСПРАВЛЕНО: Обращаемся к классу событий
    if (this.inventoryUI.events) {
        this.inventoryUI.events.onMouseMove(e); 
    }
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
        // ИСПРАВЛЕНО: вызываем refresh через renderer
        this.inventoryUI.renderer.refresh();
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
        // ИСПРАВЛЕНО: вызываем refresh через renderer
        this.inventoryUI.renderer.refresh();
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
    
    // ИСПРАВЛЕНО: Прячем подсказку через renderer
    if (this.inventoryUI && this.inventoryUI.renderer) {
        this.inventoryUI.renderer.hideTooltip();
    }
    
    this.selectedIndex = null;
    if (this.currentChest) {
        this.currentChest.isOpen = false;
        this.currentChest = null;
    }
}

refresh() {
    if (!this.currentChest) return;
    const slots = this.gridElement.children;

    for (let i = 0; i < 15; i++) {
        const item = this.currentChest.slots[i];
        const slotDiv = slots[i];
        const isSelected = this.selectedIndex === i;
        
        const itemKey = item ? `${item.id}-${item.count}` : 'empty';
        
        if (slotDiv.dataset.itemKey === itemKey && slotDiv.dataset.selected === String(isSelected)) {
            continue; 
        }

        slotDiv.dataset.itemKey = itemKey;
        slotDiv.dataset.selected = isSelected;
        
        // УДАЛЯЕМ slotDiv.textContent = ""; — это ломает структуру!
        slotDiv.classList.toggle('selected', isSelected);

        // ВЫЗЫВАЕМ ПРАВИЛЬНЫЙ МЕТОД
        // Аргументы: slotDiv, item, showTimer, index, isMainGrid
        this.inventoryUI.renderer.updateSlotDOM(slotDiv, item, false, i, false);
    }
}
}
