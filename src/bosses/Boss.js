// Boss.js
export class Boss {
  constructor({ x, y, hp }) {
    this.x = x;
    this.y = y;

    this.hp = hp;
    this.maxHp = hp; // ⬅️ ВАЖНО
    this.isAlive = true;
  }
}
