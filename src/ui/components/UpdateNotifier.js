/* src/ui/components/UpdateNotifier.js */
export class UpdateNotifier {
    constructor() {
        this.currentVersion = localStorage.getItem('game_version') || '1.0.0';
        this.serverData = null;
        
        this.initVersionBadge();
    }

    // Создаем маленькую плашку с текущей версией в ЛЕВОМ верхнем углу
    initVersionBadge() {
        const oldBadge = document.getElementById('game-version-badge');
        if (oldBadge) oldBadge.remove();

        const badge = document.createElement('div');
        badge.id = 'game-version-badge';
        badge.style.cssText = `
            position: fixed;
            top: 15px;
            left: 15px; /* Перенесли в левый угол */
            background: rgba(0, 0, 0, 0.6);
            color: rgba(255, 255, 255, 0.7);
            padding: 5px 10px;
            border-radius: 4px;
            font-family: sans-serif;
            font-size: 12px;
            pointer-events: none;
            z-index: 100001; /* Поверх всего */
            letter-spacing: 1px;
        `;
        badge.innerText = `v${this.currentVersion}`;
        
        document.body.appendChild(badge);
    }

    async checkUpdates() {
        try {
            const response = await fetch('./version.json?t=' + new Date().getTime());
            this.serverData = await response.json();
            
            if (this.serverData && this.serverData.version !== this.currentVersion) {
                return new Promise((resolve) => {
                    this.showUpdateBanner(resolve);
                });
            }
        } catch (error) {
            console.log('📶 Режим оффлайн или сервер обновлений недоступен.');
        }
        return false;
    }

    // Минималистичная плашка по центру экрана
    showUpdateBanner(onClose) {
        if (document.getElementById('update-notification-banner')) {
            if (onClose) onClose();
            return;
        }

        const banner = document.createElement('div');
        banner.id = 'update-notification-banner';
        
        // Простые обтекаемые формы, без свечения, по центру экрана
        banner.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 450px;
            background: #858282;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            color: #cacaca;
            padding: 20px;
            font-family: sans-serif;
            z-index: 100002;
            display: flex;
            flex-direction: column;
            gap: 15px;
            box-sizing: border-box;
        `;

        const description = this.serverData.description || 'Доступны новые исправления и улучшения!';
        // Используем картинку из json или стандартный скриншот из структуры папок
        const imageUrl = this.serverData.image || 'assets/screenshot/screenshot..PNG'; 

        banner.innerHTML = `
            <div style="font-weight: bold; font-size: 18px; text-align: center;">
                Обновление: v${this.serverData.version}
            </div>
            
            <img src="${imageUrl}" alt="Скриншот обновления" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 4px; display: block;">
            
            <div style="font-size: 14px; color: #1d1c1c; line-height: 1.5; max-height: 100px; overflow-y: auto;">
                ${description}
            </div>
            
            <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                <button id="btn-update-now" style="background: #27ae60; border: none; color: white; padding: 10px 24px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 14px;">ОБНОВИТЬ</button>
            </div>
        `;

        // Фон для затемнения заднего плана (опционально, но помогает акцентировать окно в центре)
        const overlay = document.createElement('div');
        overlay.id = 'update-notification-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 100001;
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(banner);

        // Только одна кнопка
        document.getElementById('btn-update-now').onclick = async () => {
            await this.applyUpdate();
        };
    }

    async applyUpdate() {
        const updateBtn = document.getElementById('btn-update-now');
        if (updateBtn) {
            updateBtn.disabled = true;
            updateBtn.innerText = 'Загрузка...';
        }

        try {
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let reg of registrations) {
                    await reg.unregister();
                }
            }

            localStorage.setItem('game_version', this.serverData.version);
            window.location.reload(true);
        } catch (error) {
            console.error('Ошибка при обновлении игры:', error);
            alert('Не удалось обновить игру автоматически. Пожалуйста, перезагрузите страницу вручную.');
        }
    }
}