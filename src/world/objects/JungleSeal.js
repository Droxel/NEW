import { GameState } from "../../core/GameState.js";

export class JungleSeal {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = "jungle_seal";
        this.alpha = 1.0;
        this.state = 'active';

        // --- НОВОЕ: Для анимации магического свечения ---
        // Запоминаем время создания, чтобы свечение было уникальным для каждой печати
        this.creationTime = performance.now();
        
        // Генерируем несколько случайных точек для "искр" внутри барьера
        this.magicSparks = [];
        for(let i = 0; i < 15; i++) {
            this.magicSparks.push({
                x: Math.random(), // Относительная координата (0-1)
                y: Math.random(), // Относительная координата (0-1)
                size: Math.random() * 3 + 1,
                phase: Math.random() * Math.PI * 2 // Случайная фаза мерцания
            });
        }
    }

    update() {
        // Если босс убит — начинаем рассыпаться
        if (GameState.bossesDefeated['jungle_boss'] && this.state === 'active') {
            this.state = 'crumbling';
        }

        if (this.state === 'crumbling' && this.alpha > 0) {
            this.alpha -= 0.005; // Та же скорость, что у стражей
        }
    }

    draw(ctx) {
        if (this.alpha <= 0) return;

        // Получаем текущее время для плавных анимаций
        const now = performance.now() - this.creationTime;

        ctx.save();
        ctx.globalAlpha = this.alpha;

        // --- 1. ТЕМНЫЙ ФОН БАРЬЕРА ---
        // Глубокий темный зелено-синий, чтобы магия выделялась
        ctx.fillStyle = "#122115"; 
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // --- 2. ВОЛНИСТОЕ МАГИЧЕСКОЕ ЗАПОЛНЕНИЕ (Plasma) ---
        // Создаем радиальный градиент, который плавно пульсирует
        const pulse = Math.sin(now / 1000) * 0.1 + 0.9; // Пульсация от 0.8 до 1.0
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2, this.y + this.height / 2, 0,
            this.x + this.width / 2, this.y + this.height / 2, this.width * 0.75 * pulse
        );
        gradient.addColorStop(0, "rgba(40, 255, 120, 0.4)");  // Яркий центр (прозрачный)
        gradient.addColorStop(1, "rgba(20, 100, 50, 0.0)");   // Уходит в темноту

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // --- 3. ДРЕВНИЕ РУНЫ (Светящиеся переплетения) ---
        // Включаем свечение только для рун и искр!
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#33ff88"; // Ярко-зеленое свечение
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgba(180, 255, 200, ${this.alpha * (Math.sin(now/500)*0.2+0.8)})`; // Яркий лаймовый с легким мерцанием

        // Рисуем абстрактное переплетение рун
        ctx.beginPath();
        const rows = 4;
        const cols = 3;
        const cellW = this.width / cols;
        const cellH = this.height / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Генерируем "случайный" узор на основе ячейки, но зависящий от времени
                const centerX = this.x + c * cellW + cellW/2;
                const centerY = this.y + r * cellH + cellH/2;
                const radius = Math.min(cellW, cellH) * 0.35;
                const seed = (r * cols + c); // Уникальное число для каждой ячейки

                // Пример руны: пульсирующий круг с крестом внутри
                if ((seed + Math.floor(now/2000)) % 2 === 0) { // Руны иногда меняются
                   // Руна "Круг Силы"
                   ctx.moveTo(centerX + radius, centerY);
                   ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                   ctx.moveTo(centerX - radius*0.7, centerY - radius*0.7);
                   ctx.lineTo(centerX + radius*0.7, centerY + radius*0.7);
                   ctx.moveTo(centerX + radius*0.7, centerY - radius*0.7);
                   ctx.lineTo(centerX - radius*0.7, centerY + radius*0.7);
                } else {
                   // Руна "Переплетение Джунглей"
                   ctx.moveTo(centerX, centerY - radius);
                   ctx.lineTo(centerX, centerY + radius);
                   ctx.moveTo(centerX - radius, centerY);
                   ctx.lineTo(centerX + radius, centerY);
                   
                   ctx.moveTo(centerX - radius*0.8, centerY - radius*0.5);
                   ctx.bezierCurveTo(centerX, centerY, centerX, centerY, centerX + radius*0.8, centerY + radius*0.5);
                   
                   ctx.moveTo(centerX + radius*0.8, centerY - radius*0.5);
                   ctx.bezierCurveTo(centerX, centerY, centerX, centerY, centerX - radius*0.8, centerY + radius*0.5);
                }
            }
        }
        ctx.stroke();

        // --- 4. МЕРЦАЮЩИЕ МАГИЧЕСКИЕ ИСКРЫ ---
        // Мы используем тот же shadowBlur, который включили выше
        ctx.fillStyle = "white"; // Яркие точки внутри свечения
        this.magicSparks.forEach(spark => {
            // Рассчитываем мерцание для каждой искры индивидуально
            const sparkSparkle = Math.sin((now / 200) + spark.phase) * 0.3 + 0.7; // Мерцание от 0.4 до 1.0
            ctx.globalAlpha = this.alpha * sparkSparkle;

            // Рисуем искру как маленький кружок
            const sparkX = this.x + spark.x * this.width;
            const sparkY = this.y + spark.y * this.height;

            ctx.beginPath();
            ctx.arc(sparkX, sparkY, spark.size * (0.8 + sparkSparkle * 0.4), 0, Math.PI * 2);
            ctx.fill();
        });

        // --- 5. ВОЛНА СИЛЫ (Линия, проходящая сверху вниз) ---
        // Создаем эффект "сканирующей" магической волны
        const wavePos = (now % 3000) / 3000; // Позиция от 0 до 1 каждые 3 секунды
        const waveY = this.y + wavePos * this.height;

        const waveGradient = ctx.createLinearGradient(0, waveY - 20, 0, waveY + 20);
        waveGradient.addColorStop(0, "rgba(100, 255, 200, 0)");
        waveGradient.addColorStop(0.5, "rgba(200, 255, 230, 0.8)"); // Яркий центр волны
        waveGradient.addColorStop(1, "rgba(100, 255, 200, 0)");

        ctx.globalAlpha = this.alpha * 0.5; // Сделать волну полупрозрачной
        ctx.fillStyle = waveGradient;
        ctx.fillRect(this.x, waveY - 20, this.width, 40);

        ctx.restore();
    }
}