//InventoryRenderer.js
import { assets } from "../../../core/Braw.js"; 
import { player } from "../../../entities/player/Player.js"; 
import { dragData } from "./InventoryEvents.js";

export class InventoryRenderer {
    constructor(ui) {
        this.ui = ui; // Ссылка на диспетчер
        this.gameBox = document.getElementById('game-box'); // Кэшируем сразу
    }

    createUI() { 
        const fragment = document.createDocumentFragment(); // Используем фрагмент для батчинга DOM-операций

        const btn = document.createElement('div'); 
        btn.innerHTML = '<img src="./assets/images/ui/cam.svg" class="full-size-img">'; 
        btn.className = 'inventory-toggle'; 
        btn.onclick = () => this.ui.toggle(); 
        
        if (this.gameBox) this.gameBox.appendChild(btn);  
        else document.body.appendChild(btn); 

        this.overlay = document.createElement('div'); 
        this.overlay.className = 'inventory-overlay'; // Стили ушли в CSS

        this.useBtn = document.createElement('div'); 
        this.useBtn.className = 'use-btn-overlay'; // Стили ушли в CSS
        this.useBtn.innerHTML = `<span class="use-btn-text">ВЫБЕРИ<br>ПРЕДМЕТ</span>`; 
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
         
        fragment.appendChild(this.overlay); 
        document.body.appendChild(fragment); // Добавляем все в DOM за 1 раз
    } 

    createSection(title, count, cssClass) { 
        const container = document.createElement('div'); 
        container.innerHTML = `<h3 class="section-title">${title}</h3>`; 
        
        const grid = document.createElement('div'); 
        grid.className = `grid ${cssClass}`; 

        const getTargetArray = () => {
            switch(cssClass) {
                case 'main-grid': return this.ui.inventory.mainSlots;
                case 'bubble-grid': return this.ui.inventory.bubbleSlots;
                case 'currency-grid': return this.ui.inventory.currencySlots;
                case 'accessory-grid': return this.ui.inventory.accessorySlots;
                case 'chest-grid': return this.ui.currentChest ? this.ui.currentChest.slots : null;
                default: return null;
            }
        };

        for (let i = 0; i < count; i++) { 
            const slot = document.createElement('div'); 
            slot.className = 'slot'; 
            slot.dataset.slotIndex = i; 
            slot.dataset.gridType = cssClass; 

            // ПРЕДСОЗДАЕМ элементы, чтобы не делать innerHTML = "" при рендере
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

            slot.onmousedown = (e) => {
                const targetArray = getTargetArray();
                if (!targetArray || !targetArray[i]) return;  
                e.preventDefault(); 
                this.ui.events.startDrag(targetArray[i], targetArray, i, e.clientX, e.clientY, 0); 
            };
            
            slot.ontouchstart = (e) => {
                const targetArray = getTargetArray();
                if (!targetArray || !targetArray[i]) return;
                e.preventDefault(); 
                const touch = e.touches[0]; 
                this.ui.events.touchStartX = touch.clientX; 
                this.ui.events.touchStartY = touch.clientY; 
                this.ui.events.startDrag(targetArray[i], targetArray, i, touch.clientX, touch.clientY, -60); 
            };
             
            grid.appendChild(slot); 
        } 
        container.appendChild(grid); 
        return { container, grid }; 
    }

    createHotbar() { 
        this.hotbarContainer = document.createElement('div'); 
        this.hotbarContainer.id = 'hotbar'; 
        
        if(this.gameBox) this.gameBox.appendChild(this.hotbarContainer); 
        else document.body.appendChild(this.hotbarContainer); 

        for (let i = 0; i < 5; i++) { 
            const slot = document.createElement('div'); 
            slot.className = 'slot'; 
            
            const num = document.createElement('span'); 
            num.className = 'hotbar-num';
            num.innerText = i + 1; 

            // Предсоздаем элементы контента
            const img = document.createElement('img');
            img.className = 'slot-img';
            img.style.display = 'none';

            const countDiv = document.createElement('div');
            countDiv.className = 'slot-count';

            const timerDiv = document.createElement('div');
            timerDiv.className = 'slot-timer';
            timerDiv.style.display = 'none';

            slot.appendChild(num); 
            slot.appendChild(img);
            slot.appendChild(countDiv);
            slot.appendChild(timerDiv);

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
         
        this.tooltip.style.left = (x > window.innerWidth - 150) ? `${x - 160}px` : `${x + 15}px`; 
        this.tooltip.style.top = `${y + 15}px`; 
    } 

    hideTooltip() { 
        if(this.tooltip) this.tooltip.style.display = 'none'; 
    } 

    refresh() { 
        this.renderGrid(this.mainGridElement, this.ui.inventory.mainSlots, true); 
        this.renderGrid(this.currencyGridElement, this.ui.inventory.currencySlots, false); 
        this.renderGrid(this.bubbleGridElement, this.ui.inventory.bubbleSlots, false);  
        this.renderGrid(this.accGridElement, this.ui.inventory.accessorySlots, false); 
        
        if (this.chestGridElement && this.ui.currentChest) {
            this.renderGrid(this.chestGridElement, this.ui.currentChest.slots, false);
        }

        this.refreshHotbar(); 
        this.updateUseButtonState(); 
        
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
            this.updateSlotDOM(slotDiv, item, true, i, false);
        } 

        if (this.ui.mobileHealBtn) { 
            if (hasPotionInInventory) { 
                this.ui.mobileHealBtn.classList.remove('inactive', 'no-bg');
                this.ui.mobileHealBtn.classList.add('potion-bg');

                if (player.potionCooldown > 0) { 
                    this.ui.mobileHealBtn.classList.add('inactive'); 
                    this.ui.mobileHealBtn.innerText = Math.ceil(player.potionCooldown / 60); 
                } else { 
                    this.ui.mobileHealBtn.classList.remove('inactive'); 
                    this.ui.mobileHealBtn.innerText = ""; 
                } 
            } else { 
                this.ui.mobileHealBtn.classList.add('inactive', 'no-bg');
                this.ui.mobileHealBtn.classList.remove('potion-bg');
                this.ui.mobileHealBtn.innerText = ""; 
            } 
        } 
    } 

    renderGrid(gridElement, dataArray, isMainGrid) { 
        const slots = gridElement.children; 
        for (let i = 0; i < slots.length; i++) { 
            const item = dataArray[i]; 
            const slotDiv = slots[i]; 
            
            const isSelected = (isMainGrid && this.ui.selectedSlotIndex === i);
            slotDiv.classList.toggle('selected-slot', isSelected);

            const newItemId = item ? `${item.id}_${item.count}_${player.potionCooldown}` : "empty";

            if (slotDiv.dataset.itemId !== newItemId) {
                this.updateSlotDOM(slotDiv, item, false, i, isMainGrid);
                slotDiv.dataset.itemId = newItemId;
            }
        } 
    }

    // НОВАЯ ФУНКЦИЯ: Обновляет только свойства, не ломая DOM
    updateSlotDOM(slotDiv, item, showTimer, index, isMainGrid) {
        const img = slotDiv.querySelector('.slot-img');
        const countDiv = slotDiv.querySelector('.slot-count');
        const timerDiv = slotDiv.querySelector('.slot-timer');

        if (item && item.count > 0) {
            let imgSrc = item.icon;
            if (!imgSrc && item.type === 'crystal' && assets.crystal?.src) {
                imgSrc = assets.crystal.src;
            }
            
            if (imgSrc) {
                img.src = imgSrc;
                img.style.display = 'block';
            } else {
                img.style.display = 'none';
            }

            countDiv.innerText = item.count > 1 ? item.count : "";

            if (showTimer && item.id === 'potion_hp' && player.potionCooldown > 0) {
                timerDiv.innerText = Math.ceil(player.potionCooldown / 60);
                timerDiv.style.display = 'flex';
            } else if (timerDiv) {
                timerDiv.style.display = 'none';
            }

            slotDiv.onclick = (e) => { 
                e.stopPropagation(); 
                if (isMainGrid) this.ui.events.selectSlot(index, item, 'main-grid'); 
                this.showTooltip(item, e); 
            }; 
        } else {
            // Очищаем слот
            if (img) img.style.display = 'none';
            if (countDiv) countDiv.innerText = "";
            if (timerDiv) timerDiv.style.display = 'none';
            slotDiv.onclick = (e) => {
                e.stopPropagation();
                if (isMainGrid) this.ui.events.selectSlot(index, null, 'main-grid');
                this.hideTooltip();
            };
        }
    }

    updateUseButtonState() { 
        if (this.ui.selectedItem && this.ui.selectedItem.count > 0 && this.ui.selectedItem.id === 'life_fruit') { 
            this.useBtn.classList.add('ready');
            this.useBtn.innerHTML = `<img src="${this.ui.selectedItem.icon}" style="width:80%; height:80%; object-fit:contain;">`; 
        } else { 
            this.useBtn.classList.remove('ready');
            this.useBtn.innerHTML = `<span class="use-btn-text">ВЫБЕРИ<br>ПРЕДМЕТ</span>`; 
        } 
    } 
}