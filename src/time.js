// time.js
export const time = {

  // ⏳ длительность фаз (в секундах)
  dayLength: 480,
  nightLength: 420,
  cycleLength: 900,

  current: 0,

  update(dt) {
    this.current += dt;

    if (this.current >= this.cycleLength) {
      this.current -= this.cycleLength;
    }
  },

  // 🌗 фактор ночи: 0 (день) → 1 (ночь)
  getNightFactor() {
    const t = this.current / this.cycleLength;
    return (1 - Math.cos(t * Math.PI * 2)) / 2;
  },

  // 🌅 фактор утра: 0 → 1 → 0 (только утром)
  getMorningFactor() {
    const t = this.current / this.cycleLength;

    // утро — первая четверть цикла
    if (t < 0 || t > 0.25) return 0;

    const x = t / 0.25;
    return Math.sin(x * Math.PI);
  }
};
