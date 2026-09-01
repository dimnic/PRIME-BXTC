'use strict';
const { readDB, writeDB, getUser } = require('../../core/user-store');
const { randomInt } = require('../_utils');

module.exports = {
  name: 'slots',
  category: 'games',
  description: 'Slots — optional bet uses unified balance.',
  async execute(ctx) {
    const bet = Math.floor(Number(ctx.args?.[0]) || 0);
    const s = ['🍒', '🍋', '🔔', '⭐', '7️⃣'];
    const a = [s[randomInt(0, 4)], s[randomInt(0, 4)], s[randomInt(0, 4)]];
    const jackpot = a[0] === a[1] && a[1] === a[2];

    if (!bet || bet < 1) {
      return ctx.reply(
        `🎰 | ${a.join(' | ')} |\n` +
        (jackpot ? 'JACKPOT! 🎉 (no bet placed — use /slots 50 to wager)' : 'Try again! Use /slots <amount> to bet.')
      );
    }

    const db = readDB();
    const u = getUser(db, ctx.sender);
    if (bet > u.coins) {
      return ctx.reply(`❌ Not enough coins. Balance: ${u.coins}`);
    }
    let delta = -bet;
    if (jackpot) {
      delta = bet * 5;
      u.wins += 1;
    } else if (a[0] === a[1] || a[1] === a[2] || a[0] === a[2]) {
      delta = bet;
      u.wins += 1;
    } else {
      u.losses += 1;
    }
    u.coins = Math.max(0, u.coins + delta);
    writeDB(db);
    await ctx.reply(
      `🎰 | ${a.join(' | ')} |\n` +
      `${delta > 0 ? '🏆 Win!' : '😵 Loss.'} ${delta >= 0 ? '+' : ''}${delta}\n` +
      `Balance: ${u.coins.toLocaleString()}`
    );
  }
};
