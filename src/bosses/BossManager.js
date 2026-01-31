//BossManager.js
import { CubeBoss } from "./cubeBoss/CubeBoss.js";

export const bossManager = {
  boss: null,

  spawn(player) {
    this.boss = new CubeBoss(player.x - 300);
  },

  update(player) {
    if (this.boss && this.boss.isAlive) {
      this.boss.update(player);
    }
  }
};
