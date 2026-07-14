/* src/ui/components/UpdateNotifier.js */

export class UpdateNotifier {
    constructor() {
        this.currentVersion = localStorage.getItem('game_version') || '1.0.0';
        this.serverData = null;
        
        this.initVersionBadge();
        this.checkUpdates();
    }

    // Создаем маленькую плашку с текущей версией в правом верхнем углу меню
    initVersionBadge() {
        const badge = document.createElement('div');
        badge.id = 'game-version-badge';
        badge.style.cssText = `
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(0, 0, 0, 0.6);
            color: rgba(255, 255, 255, 0.7);
            padding: 5px 10px;
            border-radius: 4px;
            font-family: sans-serif;
            font-size: 12px;
            pointer-events: none;
            z-index: 9999;
            letter-spacing: 1px;
        `;
        badge.innerText = `v${this.currentVersion}`;
        
        // Прикрепляем к главному меню
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            mainMenu.appendChild(badge);
        }
    }

    // Проверяем наличие обновлений на сервере
    async checkUpdates() {
        try {
            const response = await fetch('./version.json?t=' + new Date().getTime());
            this.serverData = await response.json();
            
            if (this.serverData && this.serverData.version !== this.currentVersion) {
                this.showUpdateBanner();
            }
        } catch (error) {
            console.log('📶 Режим оффлайн или сервер обновлений недоступен.');
        }
    }

    // Показываем плашку с информацией об обновлении
    showUpdateBanner() {
        // Если плашка уже есть, не дублируем
        if (document.getElementById('update-notification-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'update-notification-banner';
        banner.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 450px;
            background: #2c3e50;
            border: 2px solid #3498db;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            color: white;
            padding: 15px 20px;
            font-family: sans-serif;
            z-index: 100000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            box-sizing: border-box;
            animation: slideUp 0.4s ease-out;
        `;

        // Краткое описание из version.json (если его там нет, покажем стандартный текст)
        const description = this.serverData.description || 'Доступны новые исправления и улучшения!';

        banner.innerHTML = `
            <div style="font-weight: bold; font-size: 16px; color: #3498db; display: flex; justify-content: space-between;">
                <span>🚀 Доступно обновление!</span>
                <span style="color: #bdc3c7; font-size: 13px;">v${this.currentVersion} → v${this.serverData.version}</span>
            </div>
            <div style="font-size: 13px; color: #ecf0f1; line-height: 1.4; max-height: 100px; overflow-y: auto; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px;">
                ${description}
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 5px;">
                <button id="btn-update-cancel" style="background: transparent; border: 1px solid #7f8c8d; color: #bdc3c7; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Позже</button>
                <button id="btn-update-now" style="background: #2ecc71; border: none; color: white; padding: 6px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px; box-shadow: 0 2px 5px rgba(46, 204, 113, 0.4);">Обновить</button>
            </div>
        `;

        document.body.appendChild(banner);

        // Кнопка "Обновить"
        document.getElementById('btn-update-now').onclick = async () => {
            await this.applyUpdate();
        };

        // Кнопка "Позже"
        document.getElementById('btn-update-cancel').onclick = () => {
            banner.remove();
        };

        // Добавляем простую анимацию появления в документ, если стилей еще нет
        if (!document.getElementById('update-banner-styles')) {
            const style = document.createElement('style');
            style.id = 'update-banner-styles';
            style.innerHTML = `
                @keyframes slideUp {
                    from { transform: translate(-50%, 100px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Логика обновления (чистка кэша, сохранение версии, перезагрузка)
    async applyUpdate() {
        const updateBtn = document.getElementById('btn-update-now');
        if (updateBtn) {
            updateBtn.disabled = true;
            updateBtn.innerText = 'Обновление...';
        }

        try {
            // Очищаем кэш Service Worker
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            // Удаляем старые регистрации Service Worker
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let reg of registrations) {
                    await reg.unregister();
                }
            }

            // Сохраняем новую версию в localStorage
            localStorage.setItem('game_version', this.serverData.version);

            // Мягко перезагружаем страницу с обходом кэша браузера
            window.location.reload(true);
        } catch (error) {
            console.error('Ошибка при обновлении игры:', error);
            alert('Не удалось обновить игру автоматически. Пожалуйста, перезагрузите страницу вручную.');
        }
    }
}