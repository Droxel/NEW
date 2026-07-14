//MainMenu.js
import { SaveManager } from "../../core/SaveManager.js";
import { WORLD_SEED, setWorldSeed } from "../../world/Seed.js";

export class MainMenu {
    constructor(onPlay) {
        this.onPlay = onPlay; // Коллбэк запуска игры

        // Контейнеры
        this.dom = document.getElementById('main-menu');
        this.menuMain = document.getElementById('menu-main');
        this.menuSelect = document.getElementById('menu-select-world');
        this.menuCreate = document.getElementById('menu-create-world');

        // Списки и инпуты
        this.worldsList = document.getElementById('worlds-list');
        this.inputName = document.getElementById('input-world-name');
        this.inputSeed = document.getElementById('input-world-seed');

        this.initEventListeners();

        this.menuSettings = document.getElementById('menu-settings');
    }

    initEventListeners() {
        // --- ГЛАВНЫЙ ЭКРАН ---
        document.getElementById('btn-play').onclick = () => this.showSelectWorld();
        document.getElementById('btn-create-menu').onclick = () => this.showCreateWorld();

        // --- ЭКРАН ВЫБОРА ---
        document.getElementById('btn-back-from-select').onclick = () => this.showMain();

        // --- ЭКРАН СОЗДАНИЯ ---
        document.getElementById('btn-back-from-create').onclick = () => this.showMain();
        document.getElementById('btn-create-confirm').onclick = () => this.handleCreateWorld();
        
        document.getElementById('btn-settings').onclick = () => this.showSettings();
    }

    showSettings() {
        this.menuMain.classList.add('hidden');
        this.menuSettings.classList.remove('hidden');
    }

    showMain() {
        this.menuMain.classList.remove('hidden');
        this.menuSelect.classList.add('hidden');
        this.menuCreate.classList.add('hidden');
        this.menuSettings.classList.add('hidden');
    }

    showCreateWorld() {
        this.menuMain.classList.add('hidden');
        this.menuSelect.classList.add('hidden');
        this.menuCreate.classList.remove('hidden');
        this.inputName.value = '';
        this.inputSeed.value = '';
    }

    showSelectWorld() {
        this.menuMain.classList.add('hidden');
        this.menuCreate.classList.add('hidden');
        this.menuSelect.classList.remove('hidden');
        
        this.renderWorldsList();
    }

    renderWorldsList() {
        this.worldsList.innerHTML = '';
        const worlds = SaveManager.getWorlds();
        const worldKeys = Object.keys(worlds);

        if (worldKeys.length === 0) {
            this.worldsList.innerHTML = '<p>Нет сохраненных миров. Создайте новый!</p>';
            return;
        }

        worldKeys.forEach(key => {
            const world = worlds[key];
            const div = document.createElement('div');
            div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.1); margin-bottom: 5px; border-radius: 5px; cursor: pointer;';
            
            div.innerHTML = `
                <div>
                    <strong>${world.name}</strong><br>
                    <small style="color: #aaa;">Сид: ${world.seed}</small>
                </div>
                <button class="menu-btn" style="padding: 5px 10px; font-size: 12px; background: #e74c3c; margin-left: 10px;">X</button>
            `;

            div.onclick = (e) => {
                if (e.target.tagName === 'BUTTON') return; 
                this.startGame(world);
            };

            const delBtn = div.querySelector('button');
            delBtn.onclick = () => {
                if (confirm(`Удалить мир "${world.name}"? Это действие необратимо!`)) {
                    SaveManager.deleteWorld(world.id);
                    this.renderWorldsList();
                }
            };

            this.worldsList.appendChild(div);
        });
    }

    handleCreateWorld() {
        let name = this.inputName.value.trim() || 'Новый мир';
        let seedValue = this.inputSeed.value.trim();
        
        let seed = seedValue ? parseInt(seedValue, 10) : Math.floor(Math.random() * 999999999) + 1;

        const newWorld = SaveManager.saveWorld({
            name: name,
            seed: seed,
            player: { hp: 100, x: 0, y: 0 } 
        });

        this.startGame(newWorld);
    }

startGame(worldData) {
        setWorldSeed(worldData.seed);
        SaveManager.setCurrentWorldId(worldData.id);

        // Скрываем плашку с версией при заходе в игру
        const versionBadge = document.getElementById('game-version-badge');
        if (versionBadge) versionBadge.style.display = 'none';

        this.hide();
        this.onPlay();
    }

    show() {
        this.dom.classList.remove('hidden');
        this.showMain();
        
        // Показываем плашку с версией снова, если мы вернулись в меню
        const versionBadge = document.getElementById('game-version-badge');
        if (versionBadge) versionBadge.style.display = 'block';
    }

    hide() {
        this.dom.classList.add('hidden');
    }
}