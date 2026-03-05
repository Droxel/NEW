/* src/ui/MainMenu.js */
export class MainMenu {
    constructor(onPlay) {
        this.dom = document.getElementById('main-menu');
        this.btnPlay = document.getElementById('btn-play');
        
        if (this.btnPlay) {
            this.btnPlay.onclick = () => {
                this.hide();
                onPlay(); // Запускает колбэк из index.html
            };
        }
    }

    show() {
        this.dom.classList.remove('hidden');
    }

    hide() {
        this.dom.classList.add('hidden');
    }
}