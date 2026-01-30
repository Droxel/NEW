export const time = {

  // ⏳ сутки
  dayLength: 15,     // 8 минут
  nightLength: 15,   // 7 минут
  cycleLength: 30,   // всего 15 минут

  current: 0,

  update(dt) {
    this.current += dt;

    if (this.current >= this.cycleLength) {
      this.current = 0;
    }
  },

  // 🌗 плавный переход день ↔ ночь
getNightFactor() {

  // t = 0 → 1 (полный цикл суток)
  let t = this.current / this.cycleLength;

  // 🌗 Волна ночи (идеально зациклена)
  return (1 - Math.cos(t * Math.PI * 2)) / 2;
}
};