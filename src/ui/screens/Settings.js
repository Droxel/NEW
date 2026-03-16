import { SaveManager } from "../../core/SaveManager.js";

export class Settings {
    constructor(onBack, onApplyResolution) {
        this.onBack = onBack;
        this.onApplyResolution = onApplyResolution;
        this.dom = document.getElementById('menu-settings');
        
        this.initEventListeners();
    }

    initEventListeners() {
        // Кнопка назад
        document.getElementById('btn-settings-back').onclick = () => this.onBack();

        // Кнопки разрешения
        const resButtons = {
            'res-low': 0.5,    // Низкое
            'res-mid': 0.8,   // Среднее
            'res-normal': 1.0, // Обычное
            'res-high': 1.25   // Высокое
        };

        Object.keys(resButtons).forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.onclick = () => {
                    const scale = resButtons[id];
                    SaveManager.saveSettings({ resolution: scale });
                    this.onApplyResolution(scale);
                    alert("Настройки применены!");
                };
            }
        });
    }

    show() { this.dom.classList.remove('hidden'); }
    hide() { this.dom.classList.add('hidden'); }
}