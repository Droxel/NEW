export let moveLeft = false;
export let moveRight = false;

export function setupInput(player) {

  // ⌨️ КЛАВИАТУРА
  document.addEventListener("keydown", (e) => {
    if (e.code === "KeyA") moveLeft = true;
    if (e.code === "KeyD") moveRight = true;
    if (e.code === "Space") player.jump();
  });

  document.addEventListener("keyup", (e) => {
    if (e.code === "KeyA") moveLeft = false;
    if (e.code === "KeyD") moveRight = false;
  });

  // 📱 ТАЧ
  const left = document.getElementById("left");
  const right = document.getElementById("right");
  const jump = document.getElementById("jump");

  if (!left) return; // если ПК — просто выходим

  // влево
  left.addEventListener("touchstart", () => moveLeft = true);
  left.addEventListener("touchend", () => moveLeft = false);

  // вправо
  right.addEventListener("touchstart", () => moveRight = true);
  right.addEventListener("touchend", () => moveRight = false);

  // прыжок
  jump.addEventListener("touchstart", () => player.jump());
}
