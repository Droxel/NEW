//InventoryRenderer.js
import { assets } from "../../../core/Braw.js"; 
import { player } from "../../../entities/player/Player.js"; 
import { dragData } from "./InventoryEvents.js";

export class InventoryRenderer {
    constructor(ui) {
        this.ui = ui; // Ссылка на диспетчер
    }

    createUI() { 
        const btn = document.createElement('div'); 
        btn.innerHTML = '<img src="./assets/images/ui/cam.svg" style="width:100%; height:100%;">'; 
        btn.className = 'inventory-toggle'; 
        btn.onclick = () => this.ui.toggle(); 
        
        const gameBox = document.getElementById('game-box'); 
        if(gameBox) gameBox.appendChild(btn);  
        else document.body.appendChild(btn); 

        this.overlay = document.createElement('div'); 
        this.overlay.className = 'inventory-overlay'; 
        this.overlay.style.display = 'none'; 
        this.overlay.style.alignItems = 'center'; 
        this.overlay.style.gap = '20px'; 

        this.useBtn = document.createElement('div'); 
        this.useBtn.style.cssText = ` 
            width: 70px; height: 70px; background: rgba(0,0,0,0.6); 
            border: 2px solid #555; border-radius: 12px; cursor: pointer; 
            display: flex; align-items: center; justify-content: center; 
            transition: 0.2s; opacity: 0.3; pointer-events: none; flex-shrink: 0; 
        `; 
        this.useBtn.innerHTML = `<span style="color:white; font-size:10px; text-align:center;">ВЫБЕРИ<br>ПРЕДМЕТ</span>`; 
        this.useBtn.onclick = () => this.ui.handleUseItem(); 
        this.overlay.appendChild(this.useBtn); 

        const mainSection = this.createSection('Рюкзак', 15, 'main-grid'); 
        this.mainGridElement = mainSection.grid; 
        
        const accSection = this.createSection('Аксы', 9, 'accessory-grid'); 
        this.accGridElement = accSection.grid; 
        
        const currencySection = this.createSection('$', 3, 'currency-grid'); 
        this.currencyGridElement = currencySection.grid; 
        
        const bubbleSection = this.createSection('Пузырь', 3, 'bubble-grid');
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

        // Вспомогательная функция для получения актуального массива данных
        const getTargetArray = () => {
            if (cssClass === 'main-grid') return this.ui.inventory.mainSlots; 
            if (cssClass === 'bubble-grid') return this.ui.inventory.bubbleSlots; 
            if (cssClass === 'currency-grid') return this.ui.inventory.currencySlots; 
            if (cssClass === 'accessory-grid') return this.ui.inventory.accessorySlots; 
            if (cssClass === 'chest-grid') return this.ui.currentChest ? this.ui.currentChest.slots : null;
            return null;
        };

        for (let i = 0; i < count; i++) { 
            const slot = document.createElement('div'); 
            slot.className = 'slot'; 
            slot.style.touchAction = 'none';  
            slot.style.userSelect = 'none'; 
            slot.style.webkitUserSelect = 'none'; 

            // Обработка зажима (ПК)
            slot.onmousedown = (e) => {
                const targetArray = getTargetArray();
                if (!targetArray) return;
                
                const item = targetArray[i];
                if (!item) return;  
                
                e.preventDefault(); 
                this.ui.events.startDrag(item, targetArray, i, e.clientX, e.clientY, 0); 
            };
            
            // Обработка касания (Мобилки)
            slot.ontouchstart = (e) => {
                const targetArray = getTargetArray();
                if (!targetArray) return;

                const item = targetArray[i];
                if (!item) return; 

                e.preventDefault(); 
                const touch = e.touches[0]; 
                this.ui.events.touchStartX = touch.clientX; 
                this.ui.events.touchStartY = touch.clientY; 
                this.ui.events.startDrag(item, targetArray, i, touch.clientX, touch.clientY, -60); 
            };
             
            slot.dataset.slotIndex = i; 
            slot.dataset.gridType = cssClass; 
            grid.appendChild(slot); 
        } 
        container.appendChild(grid); 
        return { container, grid }; 
    }

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

    createTooltip() { 
        this.tooltip = document.createElement('div'); 
        this.tooltip.className = 'item-tooltip'; 
        document.body.appendChild(this.tooltip); 
    }

    showTooltip(item, e) { 
        if (!item || dragData.isDragging) return; 
        const x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : window.innerWidth/2); 
        const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : window.innerHeight/2); 

        this.tooltip.innerHTML = `<b>${item.name}</b><br><i>${item.description || ''}</i>`; 
        this.tooltip.style.display = 'block'; 
         
        if (x > window.innerWidth - 150) this.tooltip.style.left = (x - 160) + 'px'; 
        else this.tooltip.style.left = (x + 15) + 'px'; 
        
        this.tooltip.style.top = (y + 15) + 'px'; 
    } 

    hideTooltip() { 
        if(this.tooltip) this.tooltip.style.display = 'none'; 
    } 

refresh() { 
    // Обновляем стандартные гриды игрока
    this.renderGrid(this.mainGridElement, this.ui.inventory.mainSlots, true); 
    this.renderGrid(this.currencyGridElement, this.ui.inventory.currencySlots, false); 
    this.renderGrid(this.bubbleGridElement, this.ui.inventory.bubbleSlots, false);  
    this.renderGrid(this.accGridElement, this.ui.inventory.accessorySlots, false); 
    
    // !!! СУНДУК: Если у тебя есть элемент сетки сундука, обновляй и его
    if (this.chestGridElement && this.ui.currentChest) {
        this.renderGrid(this.chestGridElement, this.ui.currentChest.slots, false);
    }

    this.refreshHotbar(); 
    this.updateUseButtonState(); 
    
    // Проверка крюка
    const hookJoy = document.getElementById("hook-joystick-container"); 
    if (hookJoy) { 
        const hasHook = this.ui.inventory.hasHook(); 
        hookJoy.style.display = hasHook ? "block" : "none"; 
        player.hasHookInInventory = hasHook; 
    } 
}

    refreshHotbar() { 
        const hotbarSlots = this.hotbarContainer.querySelectorAll('.slot'); 
        const hasPotionInInventory = this.ui.inventory.mainSlots.some(item => item && item.id === 'potion_hp'); 

        for(let i = 0; i < 5; i++) { 
            const item = this.ui.inventory.mainSlots[i]; 
            const slotDiv = hotbarSlots[i]; 
            const num = slotDiv.querySelector('span'); 
            slotDiv.innerHTML = ""; 
            slotDiv.appendChild(num); 
            if (item) this.renderItemInSlot(slotDiv, item, true, i, false);  
        } 

        if (this.ui.mobileHealBtn) { 
            if (hasPotionInInventory) { 
                this.ui.mobileHealBtn.style.backgroundImage = `url('assets/images/items/xp.svg')`; 
                this.ui.mobileHealBtn.style.backgroundSize = "70%"; 
                this.ui.mobileHealBtn.style.backgroundRepeat = "no-repeat"; 
                this.ui.mobileHealBtn.style.backgroundPosition = "center"; 

                if (player.potionCooldown > 0) { 
                    this.ui.mobileHealBtn.classList.add('inactive'); 
                    this.ui.mobileHealBtn.innerText = Math.ceil(player.potionCooldown / 60); 
                } else { 
                    this.ui.mobileHealBtn.classList.remove('inactive'); 
                    this.ui.mobileHealBtn.innerText = ""; 
                } 
            } else { 
                this.ui.mobileHealBtn.style.backgroundImage = 'none'; 
                this.ui.mobileHealBtn.classList.add('inactive'); 
                this.ui.mobileHealBtn.innerText = ""; 
            } 
        } 
    } 

renderGrid(gridElement, dataArray, isMainGrid) { 
    const slots = gridElement.children; 
    for (let i = 0; i < slots.length; i++) { 
        const item = dataArray[i]; 
        const slotDiv = slots[i]; 
        
        // 1. Управляем выделением через классы (CSS), а не прямые стили
        const isSelected = (isMainGrid && this.ui.selectedSlotIndex === i);
        slotDiv.classList.toggle('selected-slot', isSelected);

        // 2. Обновляем содержимое слота ТОЛЬКО если оно изменилось
        const currentItemId = slotDiv.dataset.itemId;
        const newItemId = item ? `${item.id}_${item.count}` : "empty";

        if (currentItemId !== newItemId) {
            this.updateSlotContent(slotDiv, item, i, isMainGrid);
            slotDiv.dataset.itemId = newItemId;
        }
    } 
}

updateSlotContent(slotDiv, item, index, isMainGrid) {
    slotDiv.innerHTML = ""; // Очищаем только если реально нужно сменить контент
    if (item && item.count > 0) {
        this.renderItemInSlot(slotDiv, item, false, index, isMainGrid);
    } else {
        // Если слот пустой, можно вернуть иконку-заглушку или оставить пустым
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

        slotDiv.onclick = (e) => { 
            e.stopPropagation(); 
            if (isMainGrid) this.ui.events.selectSlot(index, item, 'main-grid'); 
            if (item) this.showTooltip(item, e); 
            else this.hideTooltip(); 
        }; 
    } 

    updateUseButtonState() { 
        if (this.ui.selectedItem && this.ui.selectedItem.count > 0 && this.ui.selectedItem.id === 'life_fruit') { 
            this.useBtn.style.opacity = "1"; 
            this.useBtn.style.pointerEvents = "auto"; 
            this.useBtn.innerHTML = `<img src="${this.ui.selectedItem.icon}" style="width:80%; height:80%; object-fit:contain;">`; 
            this.useBtn.style.border = "2px solid #ffeb3b"; 
        } else { 
            this.useBtn.style.opacity = "0.3"; 
            this.useBtn.style.pointerEvents = "none"; 
            this.useBtn.innerHTML = `<span style="color:white; font-size:10px; text-align:center;">ВЫБЕРИ<br>ПРЕДМЕТ</span>`; 
            this.useBtn.style.border = "2px solid #555"; 
        } 
    } 
}