// src/ui/components/ZoomUI.js
import { setZoom } from '../../core/Braw.js';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 1.2;
const ZOOM_STEP = 0.1;

let currentZoom = 1.0;
let targetZoom = 1.0;
let zoomAnimationId = null;

// Плавное приближение (Lerp)
function animateZoom() {
    // 0.15 - скорость сглаживания (чем меньше, тем плавнее)
    currentZoom += (targetZoom - currentZoom) * 0.15; 
    setZoom(currentZoom);

    // Если почти достигли цели, останавливаем анимацию
    if (Math.abs(targetZoom - currentZoom) > 0.001) {
        zoomAnimationId = requestAnimationFrame(animateZoom);
    } else {
        currentZoom = targetZoom;
        setZoom(currentZoom);
        zoomAnimationId = null;
    }
}

function updateZoomTarget(value) {
    targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
    
    // Обновляем ползунок визуально
    const slider = document.getElementById('zoom-slider');
    if (slider) slider.value = targetZoom;

    // Запускаем анимацию, если она ещё не идёт
    if (!zoomAnimationId) {
        animateZoom();
    }
}

// Экспортируем для вызова из Keyboard.js
export function zoomIn() { updateZoomTarget(targetZoom + ZOOM_STEP); }
export function zoomOut() { updateZoomTarget(targetZoom - ZOOM_STEP); }

export function initZoomUI() {
    const slider = document.getElementById('zoom-slider');
    const btnIn = document.getElementById('zoom-in');
    const btnOut = document.getElementById('zoom-out');

    if (!slider || !btnIn || !btnOut) return;

    slider.addEventListener('input', (e) => {
        updateZoomTarget(parseFloat(e.target.value));
    });

    btnIn.addEventListener('click', zoomIn);
    btnOut.addEventListener('click', zoomOut);
}