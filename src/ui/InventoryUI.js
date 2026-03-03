/* src/ui/InventoryUI.js */
import { assets } from "../core/braw.js";
import { player } from "../entities/player.js";
import { DroppedItem } from "../world/objects/DroppedItem.js";
import { world } from "../world/world.js";

export const dragData = {
    item: null,
    sourceArray: null,
    sourceIndex: -1,
    element: null,
    isDragging: false,
    uiRef: null,
    touchOffsetY: 0 // FIX: Запоминаем смещение для сенсора
};

export class InventoryUI {
    constructor(inventory) {
        this.inventory = inventory;
        this.isOpen = false;
        
        this.selectedSlotIndex = -1; 
        this.selectedItem = null;

        this.mobileHealBtn = document.getElementById('heal-btn');
        if (this.mobileHealBtn) {
            this.mobileHealBtn.onclick = () => this.tryUsePotion();
        }

        this.createUI();
        this.createHotbar();
        
        // --- МЫШЬ (ПК) ---
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        // --- СЕНСОР (ТЕЛЕФОН) ---
        document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.onTouchEnd(e));

        this.createTooltip();
        window.inventoryUIInstance = this; 
    }

    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'item-tooltip';
        document.body.appendChild(this.tooltip);
    }

    // --- ОБРАБОТКА МЫШИ ---
    onMouseMove(e) {
        if (!dragData.isDragging || !dragData.element) return;
        dragData.element.style.left = (e.clientX - 16) + 'px';
        dragData.element.style.top = (e.clientY - 16) + 'px';
    }

    onMouseUp(e) {
        if (!dragData.isDragging) return;
        this.handleDrop(e.clientX, e.clientY);
    }

    // --- ОБРАБОТКА СЕНСОРА (ИСПРАВЛЕНО) ---
onTouchMove(e) {
        if (!dragData.isDragging || !dragData.element) return;
        
        // Предотвращаем стандартное поведение (скролл страницы)
        if (e.cancelable) e.preventDefault(); 
        
        const touch = e.touches[0];
        // 22 - это половина ширины иконки (44/2) для центрирования
        dragData.element.style.left = (touch.clientX - 22) + 'px';
        dragData.element.style.top = (touch.clientY - 22 + dragData.touchOffsetY) + 'px';
    }

onTouchEnd(e) {
    if (!dragData.isDragging) return;
    
    const touch = e.changedTouches[0];
    // Считаем, как далеко палец ушел от начала
    const dist = Math.hypot(touch.clientX - this.touchStartX, touch.clientY - this.touchStartY);

    if (dist < 15) {
        // Если палец почти не двигался — это просто выбор предмета
        const slot = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.slot');
        const gridType = slot ? slot.dataset.gridType : 'main-grid';
        this.selectSlot(dragData.sourceIndex, dragData.item, gridType);
    } else {
        // Если тащили далеко — выбрасываем
        this.handleDrop(touch.clientX, touch.clientY);
    }
    
    this.cancelDrag();
}

    // --- ЛОГИКА БРОСКА И ВЫБОРА ---
handleDrop(clientX, clientY) {
    if (!dragData.isDragging) return;

    if (dragData.element) dragData.element.style.display = 'none';

    const targetElement = document.elementFromPoint(clientX, clientY);
    const slot = targetElement ? targetElement.closest('.slot') : null;

    if (slot && slot.dataset.gridType) {
            const targetIndex = parseInt(slot.dataset.slotIndex);
            const gridType = slot.dataset.gridType;
            let targetArray;

            if (gridType === 'main-grid') targetArray = this.inventory.mainSlots;
            else if (gridType === 'bubble-grid') targetArray = this.inventory.bubbleSlots;
            else if (gridType === 'currency-grid') targetArray = this.inventory.currencySlots;
            else if (gridType === 'accessory-grid') targetArray = this.inventory.accessorySlots;

            // Если бросили в тот же слот — это выбор предмета (для использования)
            if (dragData.sourceArray === targetArray && dragData.sourceIndex === targetIndex) {
                this.selectSlot(targetIndex, dragData.item, gridType);
            } else {
                // ПРОВЕРКА ТИПОВ ДЛЯ СПЕЦ-СЛОТОВ
                let canSwap = true;
                if (gridType === 'bubble-grid') {
                    if (targetIndex === 0 && dragData.item.type !== 'bubble') canSwap = false;
                    if (targetIndex === 1 && dragData.item.type !== 'weapon') canSwap = false;
                }

                if (canSwap && targetArray) {
                    const tempItem = targetArray[targetIndex];
                    targetArray[targetIndex] = dragData.item;
                    dragData.sourceArray[dragData.sourceIndex] = tempItem;
                    
                    // Сбрасываем выделение, если переместили выбранный предмет
                    if (dragData.sourceArray === this.inventory.mainSlots && dragData.sourceIndex === this.selectedSlotIndex) {
                        this.selectedSlotIndex = -1;
                        this.selectedItem = null;
                    }
                }
            }
        }

else {
        // Если отпустили не над слотом — выбрасываем в мир
        this.dropItemToWorld(dragData.item, dragData.sourceArray, dragData.sourceIndex);
    }

    this.cancelDrag();
}
dropItemToWorld(item, sourceArray, index) {
    if (!item) return;

    const throwDirection = player.lookDir || 1; 
    const itemData = { ...item };

    const newItem = new DroppedItem(
        player.x + player.size / 2, 
        player.y, 
        itemData
    );

    // ИСПРАВЛЕНО: vx и vy вместо velocityX/Y (согласно твоему DroppedItem.js)
    newItem.vx = throwDirection * (3 + Math.random() * 2);
    newItem.vy = -4 - Math.random() * 2;

    if (!window.droppedItems) window.droppedItems = [];
    window.droppedItems.push(newItem);

    sourceArray[index] = null;
    
    if (this.selectedSlotIndex === index) {
        this.selectedItem = null;
        this.selectedSlotIndex = -1;
    }

    console.log(`🗑️ Выброшено: ${item.name}`);
    this.refresh();
}
    // FIX: Вынес логику выбора слота в отдельный метод, чтобы вызывать его и с мыши, и с тача
    selectSlot(index, item, gridType) {
        if (gridType === 'main-grid') {
            this.selectedSlotIndex = index;
            this.selectedItem = item;
            
            // Если это был тап по экрану, показываем тултип по центру (или где был палец)
            // Но так как select вызывается после drop, event уже потерян. Просто обновим UI.
            this.refresh();
        }
        
        // Обновляем состояние кнопки "Использовать"
        this.updateUseButtonState();
    }

    cancelDrag() {
        if (dragData.element) dragData.element.remove();
        dragData.isDragging = false;
        dragData.element = null;
        dragData.item = null;
        dragData.sourceArray = null;
        this.refresh();
    }

    showTooltip(item, e) {
        if (!item) return;
        const x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : window.innerWidth/2);
        const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : window.innerHeight/2);

        this.tooltip.innerHTML = `<b>${item.name}</b><br><i>${item.description || ''}</i>`;
        this.tooltip.style.display = 'block';
        
        // Простая защита от вылета тултипа за правый край
        if (x > window.innerWidth - 150) {
            this.tooltip.style.left = (x - 160) + 'px';
        } else {
            this.tooltip.style.left = (x + 15) + 'px';
        }
        this.tooltip.style.top = (y + 15) + 'px';
    }

    hideTooltip() {
        if(this.tooltip) this.tooltip.style.display = 'none';
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.overlay.style.display = this.isOpen ? 'flex' : 'none';
        this.overlay.classList.toggle('active', this.isOpen);
        
        if (this.isOpen) {
            if (window.chestUIInstance && window.chestUIInstance.isOpen) {
                window.chestUIInstance.close();
            }
            this.refresh(); 
        } else {
            this.hideTooltip();
        }
    }

    tryUsePotion() {
         const event = new KeyboardEvent('keydown', {'code': 'KeyR'});
         document.dispatchEvent(event);
    }

    createUI() {
        // ... (Код создания кнопки камеры оставлен без изменений)
        const btn = document.createElement('div');
        btn.innerHTML = '<img src="assets/svg/cam.svg" style="width:100%; height:100%;">';
        btn.className = 'inventory-toggle';
        btn.onclick = () => this.toggle();
        const gameBox = document.getElementById('game-box');
        if(gameBox) gameBox.appendChild(btn); 
        else document.body.appendChild(btn);

        this.overlay = document.createElement('div');
        this.overlay.className = 'inventory-overlay';
        this.overlay.style.display = 'none';
        this.overlay.style.alignItems = 'center';
        this.overlay.style.gap = '20px';

        // Кнопка использования
        this.useBtn = document.createElement('div');
        this.useBtn.style.cssText = `
            width: 70px; height: 70px; background: rgba(0,0,0,0.6);
            border: 2px solid #555; border-radius: 12px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: 0.2s; opacity: 0.3; pointer-events: none;
            flex-shrink: 0;
        `;
        this.useBtn.innerHTML = '<span style="color:white; font-size:10px; text-align:center;">ВЫБЕРИ<br>ПРЕДМЕТ</span>';
        this.useBtn.onclick = () => this.handleUseItem();
        this.overlay.appendChild(this.useBtn);

        // Секции
        const mainSection = this.createSection('Рюкзак', 15, 'main-grid');
        this.mainGridElement = mainSection.grid;
        const accSection = this.createSection('Аксы', 9, 'accessory-grid');
        this.accGridElement = accSection.grid;
        const currencySection = this.createSection('$', 3, 'currency-grid');
        this.currencyGridElement = currencySection.grid;
        const bubbleSection = this.createSection('Пузырь', 2, 'bubble-grid');
        this.bubbleGridElement = bubbleSection.grid;
        
        this.bubbleGridElement.style.gridTemplateColumns = '1fr';
        this.bubbleGridElement.children[0].style.backgroundImage = 'radial-gradient(circle, rgba(255,255,255,0.1) 40%, transparent 45%)';

        this.overlay.appendChild(mainSection.container);
        this.overlay.appendChild(accSection.container);
        this.overlay.appendChild(currencySection.container);
        this.overlay.appendChild(bubbleSection.container); 
        
        document.body.appendChild(this.overlay);
    }

createSection(title, count, cssClass) {
        const container = document.createElement('div');
        container.innerHTML = `<h3 style="margin-top:0; color: white; font-size: 14px;">${title}</h3>`;
        const grid = document.createElement('div');
        grid.className = `grid ${cssClass}`;
        
        let targetArray;
        if (cssClass === 'main-grid') targetArray = this.inventory.mainSlots;
        else if (cssClass === 'bubble-grid') targetArray = this.inventory.bubbleSlots;
        else if (cssClass === 'currency-grid') targetArray = this.inventory.currencySlots;
        else if (cssClass === 'accessory-grid') targetArray = this.inventory.accessorySlots;

        for (let i = 0; i < count; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot';
            
            // КРИТИЧЕСКИЙ ФИКС ДЛЯ ТЕЛЕФОНОВ:
            // touch-action: none запрещает браузеру скроллить, когда мы трогаем слот
            slot.style.touchAction = 'none'; 
            slot.style.userSelect = 'none';
            slot.style.webkitUserSelect = 'none';

            slot.onmousedown = (e) => this.onSlotMouseDown(e, targetArray, i);
            slot.ontouchstart = (e) => this.onSlotTouchStart(e, targetArray, i);
            
            slot.dataset.slotIndex = i;
            slot.dataset.gridType = cssClass;
            grid.appendChild(slot);
        }
        container.appendChild(grid);
        return { container, grid };
    }

    onSlotMouseDown(e, sourceArray, index) {
        const item = sourceArray[index];
        if (!item) return; 
        e.preventDefault();
        // Для мыши смещение 0
        this.startDrag(item, sourceArray, index, e.clientX, e.clientY, 0);
    }

onSlotTouchStart(e, sourceArray, index) {
    const item = sourceArray[index];
    if (!item) return;

    e.preventDefault();
    const touch = e.touches[0];
    
    // Запоминаем точку начала касания
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;

    // Смещение -60, чтобы иконка была чуть выше пальца и её было видно
    this.startDrag(item, sourceArray, index, touch.clientX, touch.clientY, -60);
}

startDrag(item, sourceArray, index, startX, startY, touchOffsetY = 0) {
        if (dragData.element) dragData.element.remove();

        dragData.item = item;
        dragData.sourceArray = sourceArray;
        dragData.sourceIndex = index;
        dragData.isDragging = true;
        dragData.touchOffsetY = touchOffsetY;

        const dragEl = document.createElement('img');
        dragEl.src = item.icon || 'assets/svg/xp.svg';
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
    // ... createHotbar оставлен без изменений ...
    createHotbar() {
        this.hotbarContainer = document.createElement('div');
        this.hotbarContainer.id = 'hotbar';
        this.hotbarContainer.style.cssText = "position:absolute; left:160px; top:10px; display:flex; gap:5px;";
        const gameBox = document.getElementById('game-box');
        if(gameBox) gameBox.appendChild(this.hotbarContainer);
        else document.body.appendChild(this.hotbarContainer);

        for (let i = 0; i < 5; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot';
            const num = document.createElement('span');
            num.innerText = i + 1;
            num.style.cssText = "position:absolute; top:1px; left:2px; font-size:9px; color:#ccc;";
            slot.appendChild(num);
            this.hotbarContainer.appendChild(slot);
        }
        this.refreshHotbar();
    }


refresh() {
    this.renderGrid(this.mainGridElement, this.inventory.mainSlots, true);
    this.renderGrid(this.currencyGridElement, this.inventory.currencySlots, false);
    this.renderGrid(this.bubbleGridElement, this.inventory.bubbleSlots, false); 
    this.renderGrid(this.accGridElement, this.inventory.accessorySlots, false);
    this.refreshHotbar();
    this.updateUseButtonState();

    // --- НОВОЕ: Управление джойстиком ---
    const hookJoy = document.getElementById("hook-joystick-container");
    if (hookJoy) {
        const hasHook = this.inventory.hasHook();
        // Если крюк есть - показываем, если нет - скрываем
        hookJoy.style.display = hasHook ? "block" : "none";
        
        // Обновляем свойство игрока, чтобы работала кнопка G на клавиатуре
        player.hasHookInInventory = hasHook;
    }
}

    refreshHotbar() {
        const hotbarSlots = this.hotbarContainer.querySelectorAll('.slot');
        let hasPotion = false; 
        for(let i=0; i<5; i++) {
            const item = this.inventory.mainSlots[i];
            const slotDiv = hotbarSlots[i];
            const num = slotDiv.querySelector('span');
            slotDiv.innerHTML = "";
            slotDiv.appendChild(num);
            if (item) {
                this.renderItemInSlot(slotDiv, item, true, i, false); 
                if (item.id === 'potion_hp') hasPotion = true;
            }
        }
        if (this.mobileHealBtn) {
            if (hasPotion) {
                this.mobileHealBtn.style.backgroundImage = `url('assets/svg/xp.svg')`;
                if (player.potionCooldown > 0) {
                      this.mobileHealBtn.classList.add('inactive');
                      this.mobileHealBtn.innerText = Math.ceil(player.potionCooldown / 60);
                } else {
                      this.mobileHealBtn.classList.remove('inactive');
                      this.mobileHealBtn.innerText = "";
                }
            } else {
                this.mobileHealBtn.style.backgroundImage = 'none';
                this.mobileHealBtn.classList.add('inactive');
                this.mobileHealBtn.innerText = "";
            }
        }
    }

    renderGrid(gridElement, dataArray, isMainGrid) {
        const slots = gridElement.children;
        for (let i = 0; i < slots.length; i++) {
            const item = dataArray[i];
            const slotDiv = slots[i];
            slotDiv.innerHTML = ""; 
            
            if (isMainGrid && this.selectedSlotIndex === i) {
                slotDiv.style.border = "2px solid #ffeb3b";
                slotDiv.style.backgroundColor = "rgba(255, 235, 59, 0.1)";
            } else {
                slotDiv.style.border = ""; 
                slotDiv.style.backgroundColor = "";
            }

            if (item) this.renderItemInSlot(slotDiv, item, false, i, isMainGrid);
        }
    }

    renderItemInSlot(slotDiv, item, showTimer, index, isMainGrid) {
        const img = document.createElement('img');
        if (item.icon) img.src = item.icon;
        else if (item.type === 'crystal' && assets.crystal?.src) img.src = assets.crystal.src;
        
        img.style.cssText = "width:70%; height:70%; object-fit:contain; pointer-events:none;";
        
        const countDiv = document.createElement('div');
        countDiv.innerText = item.count > 1 ? item.count : "";
        countDiv.style.cssText = `
            position: absolute; bottom: 1px; right: 2px;
            color: white; font-size: 10px; font-weight: bold;
            text-shadow: 1px 1px 0 #000; pointer-events:none;
        `;

        slotDiv.appendChild(img);
        slotDiv.appendChild(countDiv);
        
        if (showTimer && item.id === 'potion_hp' && player.potionCooldown > 0) {
            const timerDiv = document.createElement('div');
            timerDiv.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; color:white; font-size:12px; border-radius:4px; pointer-events:none;";
            timerDiv.innerText = Math.ceil(player.potionCooldown / 60);
            slotDiv.appendChild(timerDiv);
        }

        // FIX: Оставляем onclick только для ПК. Для сенсора логика в handleDrop
        slotDiv.onclick = (e) => {
            // Этот код сработает только на ПК, т.к. на телефоне preventDefault в touchstart отменит click
            e.stopPropagation();
            if (isMainGrid) {
                this.selectSlot(index, item, 'main-grid');
            }
            this.showTooltip(item, e);
        };
        slotDiv.onmouseleave = () => this.hideTooltip();
        
        // ДВОЙНОЙ КЛИК (ПК)
        slotDiv.ondblclick = (e) => {
            e.stopPropagation();
            if (item.id === 'life_fruit' && isMainGrid) {
                this.selectSlot(index, item, 'main-grid');
                this.handleUseItem();
            }
        };
    }

    updateUseButtonState() {
        if (this.selectedItem && this.selectedItem.id === 'life_fruit') {
            this.useBtn.style.opacity = "1";
            this.useBtn.style.pointerEvents = "auto";
            this.useBtn.innerHTML = `<img src="${this.selectedItem.icon}" style="width:80%; height:80%; object-fit:contain;">`;
            this.useBtn.style.border = "2px solid #ffeb3b";
        } else {
            this.useBtn.style.opacity = "0.3";
            this.useBtn.style.pointerEvents = "none";
            this.useBtn.innerHTML = '<span style="color:white; font-size:10px; text-align:center;">ВЫБЕРИ<br>ПРЕДМЕТ</span>';
            this.useBtn.style.border = "2px solid #555";
        }
    }

    handleUseItem() {
        if (this.selectedItem && this.selectedItem.id === 'life_fruit') {
            if (player.maxHp >= 20) return; 

            player.maxHp += 1;
            player.hp += 1; 
            
            this.inventory.consumeItem(this.selectedSlotIndex);
            
            if (!this.inventory.mainSlots[this.selectedSlotIndex]) {
                this.selectedItem = null;
                this.selectedSlotIndex = -1;
            } else {
                this.selectedItem = this.inventory.mainSlots[this.selectedSlotIndex];
            }
            this.refresh();
        }
    }
}