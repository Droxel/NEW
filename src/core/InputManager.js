import { InputState } from "./input/InputState.js";
import { setupKeyboard } from "./input/Keyboard.js";
import { setupPointer } from "./input/Pointer.js";
import { setupMobile } from "./input/Mobile.js";
import { GrapplingHook } from "../entities/player/tools/GrapplingHook.js";

// Экспортируем состояние, чтобы main.js мог его читать
export { InputState };

export function setupInput(player) {
    const canvas = document.getElementById("game");

    // Инициализация крюка
    if (!player.hook) {
        player.hook = new GrapplingHook(player);
        console.log("✅ Система крюка готова!");
    }

    // Подключаем модули
    setupKeyboard(player, InputState);
    setupPointer(player, canvas, InputState);
    setupMobile(player, InputState);
}