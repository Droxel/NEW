/* src/ui/MainMenu.js */
import { SaveManager } from "../../core/SaveManager.js";
import { WORLD_SEED, setWorldSeed } from "../../world/Seed.js";
import { UpdateNotifier } from "../components/UpdateNotifier.js";

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

        // Инициализируем систему проверки обновлений и плашку с версией
        this.updateNotifier = new UpdateNotifier();
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
    this.menuSettings.classList.add('hidden'); // Добавили эту строку
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

        // Рендерим список миров
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

            // Клик по карточке мира - запуск игры
            div.onclick = (e) => {
                // Если кликнули на кнопку удаления - не запускаем игру
                if (e.target.tagName === 'BUTTON') return; 
                this.startGame(world);
            };

            // Кнопка удаления
            const delBtn = div.querySelector('button');
            delBtn.onclick = () => {
                if (confirm(`Удалить мир "${world.name}"? Это действие необратимо!`)) {
                    SaveManager.deleteWorld(world.id);
                    this.renderWorldsList(); // Обновляем список
                }
            };

            this.worldsList.appendChild(div);
        });
    }

    handleCreateWorld() {
        let name = this.inputName.value.trim() || 'Новый мир';
        let seedValue = this.inputSeed.value.trim();
        
        // Если сид пустой - генерируем случайный (от 1 до 999999999)
        let seed = seedValue ? parseInt(seedValue, 10) : Math.floor(Math.random() * 999999999) + 1;

        const newWorld = SaveManager.saveWorld({
            name: name,
            seed: seed,
            // Сюда потом будем добавлять инвентарь, позицию игрока и т.д.
            player: { hp: 100, x: 0, y: 0 } 
        });

        this.startGame(newWorld);
    }

    startGame(worldData) {
        // Устанавливаем сид для генератора
        setWorldSeed(worldData.seed);
        // Запоминаем, какой мир сейчас активен
        SaveManager.setCurrentWorldId(worldData.id);

        this.hide();
        this.onPlay(); // Передаем управление в index.html
    }

    show() {
        this.dom.classList.remove('hidden');
        this.showMain();
    }

    hide() {
        this.dom.classList.add('hidden');
    }
}