//Resident.js
export class Resident {
    constructor(x, minX, maxX) {
        this.x = x;
        this.minX = minX; 
        this.maxX = maxX; 
        
        this.size = 30; 
        this.width = this.size;
        this.height = this.size;
        
        this.speed = 0.3 + Math.random() * 0.4; 
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.state = "walk"; 
        this.stateTimer = 2 + Math.random() * 5;
        
        this.jumpY = 0;
        this.jumpSpeed = 0;
        
        this.eyeLookX = 0;
        this.eyeLookY = 0;
        this.targetEyeX = 0;
        this.targetEyeY = 0;
        this.eyeChangeTimer = 0;

        const skinColors = ["#FFDAB9", "#F5DEB3", "#E8C396", "#E5C298", "#D2B48C"];
        this.skinColor = skinColors[Math.floor(Math.random() * skinColors.length)];
        this.hatType = Math.random() > 0.5 ? 1 : 0; 

        this.talkTimer = Math.random() * 10 + 5; 
        this.voiceLines = ["residents/no-3-v", "residents/rozgovor1", "residents/rozgovor2"];
    }

    update(world, audioManager, player, dt) {
        this.updateAI(world, dt);
        this.updateEyes(player, dt);
        
        // Физика прыжка
        if (this.state === "joy" && this.jumpY >= 0) {
            this.jumpSpeed = -2.0; 
        }
        
        if (this.jumpY < 0 || this.jumpSpeed !== 0) {
            this.jumpSpeed += 0.1; 
            this.jumpY += this.jumpSpeed;
            if (this.jumpY > 0) { this.jumpY = 0; this.jumpSpeed = 0; }
        }

        this.y = world.getHeight(this.x, true) + this.jumpY;
        
        if (this.talkTimer > 0) {
            this.talkTimer -= dt;
        } else {
            if (player && Math.abs(this.x - player.x) < 300) {
                this.saySomething(audioManager);
            }
            this.talkTimer = 10 + Math.random() * 15;
        }
    }

    updateAI(world, dt) {
        this.stateTimer -= dt;

        if (this.stateTimer <= 0) {
            const rand = Math.random();
            if (rand < 0.6) {
                this.state = "walk";
                this.direction = Math.random() > 0.5 ? 1 : -1;
            } else if (rand < 0.9) {
                this.state = "idle";
            } else {
                this.state = "joy"; 
            }
            this.stateTimer = 2 + Math.random() * 4;
        }

if (this.state === "walk") {
            // Проверяем точку чуть дальше, чем край тела жителя (запас 5 пикселей)
            const checkDistance = (this.width / 2 + 5) * this.direction;
            const nextX = this.x + (this.speed * this.direction);
            const probeX = this.x + checkDistance; // <--- Точка ПЕРЕД жителем

            let hitWall = false;

            // 1. ИСПРАВЛЕНИЕ: Проверяем по probeX, а не по центру (nextX)
            if (probeX <= this.minX || probeX >= this.maxX) {
                hitWall = true;
            }

            // 2. Проверка через физический движок мира
            if (!hitWall && world.isPointInWall) {
                if (world.isPointInWall(probeX, this.y) || 
                    world.isPointInWall(probeX, this.y - this.height)) {
                    hitWall = true;
                }
            }

            if (hitWall) {
                this.direction *= -1;
                this.stateTimer = 1; 
                this.state = "idle";
            } else {
                this.x = nextX;
            }
        }
    }

    updateEyes(player, dt) {
        this.eyeChangeTimer -= dt;
        if (this.eyeChangeTimer <= 0) {
            if (player && Math.abs(this.x - player.x) < 150) {
                // Если игрок совсем рядом — палим на него
                const dx = player.x - this.x;
                this.targetEyeX = (dx / 150) * 4;
                this.targetEyeY = 0;
            } else {
                // Иначе просто смотрим по сторонам
                this.targetEyeX = (Math.random() - 0.5) * 5;
                this.targetEyeY = (Math.random() - 0.5) * 3;
            }
            this.eyeChangeTimer = 1 + Math.random() * 2;
        }
        this.eyeLookX += (this.targetEyeX - this.eyeLookX) * 0.1;
        this.eyeLookY += (this.targetEyeY - this.eyeLookY) * 0.1;
    }

    saySomething(audioManager) {
        if (!audioManager) return;
        const randomLine = this.voiceLines[Math.floor(Math.random() * this.voiceLines.length)];
        audioManager.playSFX(randomLine, 0.15); 
    }

    draw(ctx) {
        const drawX = this.x - this.size / 2;
        const drawY = this.y - this.size + 35;

        ctx.save();
        // ТЕЛО
        ctx.fillStyle = this.skinColor;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(drawX, drawY, this.size, this.size, 6);
            ctx.fill();
        } else {
            ctx.fillRect(drawX, drawY, this.size, this.size);
        }
        
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.strokeRect(drawX, drawY, this.size, this.size);

        // ГЛАЗА
        const eyeY = drawY + this.size * 0.4;
        const eyeSpacing = this.size * 0.25;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(this.x - eyeSpacing, eyeY, 3.5, 0, Math.PI * 2);
        ctx.arc(this.x + eyeSpacing, eyeY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(this.x - eyeSpacing + this.eyeLookX, eyeY + this.eyeLookY, 1.5, 0, Math.PI * 2);
        ctx.arc(this.x + eyeSpacing + this.eyeLookX, eyeY + this.eyeLookY, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // НОС
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(this.x - 2, eyeY + 4, 4, 6);

        // ШЛЯПА
        if (this.hatType === 1) {
            ctx.fillStyle = "#E1C16E"; 
            ctx.fillRect(drawX - 4, drawY, this.size + 8, 4);
            ctx.fillRect(drawX + 6, drawY - 7, this.size - 12, 7);
            ctx.fillStyle = "#A04000";
            ctx.fillRect(drawX + 6, drawY - 3, this.size - 12, 2);
        }
        ctx.restore();
    }
}