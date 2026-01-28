const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const groundY = 230;
const gravity = 0.6;
const speed = 4;

let cube = {
    x: 100,
    y: groundY,
    size: 30,
    velocityY: 0,
    onGround: true
};

let moveLeft = false;
let moveRight = false;

/* кнопки — работают везде */
const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");
const btnJump = document.getElementById("btn-jump");

function holdButton(btn, down, up) {
    btn.addEventListener("mousedown", down);
    btn.addEventListener("mouseup", up);
    btn.addEventListener("mouseleave", up);

    btn.addEventListener("touchstart", down);
    btn.addEventListener("touchend", up);
}

holdButton(btnLeft,
    () => moveLeft = true,
    () => moveLeft = false
);

holdButton(btnRight,
    () => moveRight = true,
    () => moveRight = false
);

holdButton(btnJump,
    () => jump(),
    () => {}
);

/* клавиатура */
document.addEventListener("keydown", e => {
    if (e.code === "KeyA") moveLeft = true;
    if (e.code === "KeyD") moveRight = true;
    if (e.code === "Space") jump();
});

document.addEventListener("keyup", e => {
    if (e.code === "KeyA") moveLeft = false;
    if (e.code === "KeyD") moveRight = false
});

function jump() {
    if (cube.onGround) {
        cube.velocityY = -12;
        cube.onGround = false;
    }
}

function update() {
    if (moveLeft) cube.x -= speed;
    if (moveRight) cube.x += speed;

    cube.velocityY += gravity;
    cube.y += cube.velocityY;

    if (cube.y >= groundY) {
        cube.y = groundY;
        cube.velocityY = 0;
        cube.onGround = true;
    }

    cube.x = Math.max(0, Math.min(canvas.width - cube.size, cube.x));

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000";
    ctx.fillRect(cube.x, cube.y, cube.size, cube.size);

    ctx.fillRect(0, groundY + cube.size, canvas.width, 2);
}

update();
