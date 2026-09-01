'use strict';
const { readDB, writeDB, getUser } = require('../../core/user-store');

module.exports = {
  name: 'gamble',
  aliases: ['bet'],
  category: 'casino',
  description: 'Gamble points (unified store).',
  async execute(ctx) {
    const bet = Math.floor(Number(ctx.args?.[0]));
    if (!bet || bet < 1) return ctx.reply('Usage: /gamble 100');
    const db = readDB();
    const u = getUser(db, ctx.sender);
    if (bet > u.coins) return ctx.reply(`❌ Insufficient points. Balance: ${u.coins}`);
    const win = Math.random() < 0.48;
    if (win) {
      u.coins += bet;
      u.wins += 1;
    } else {
      u.coins = Math.max(0, u.coins - bet);
      u.losses += 1;
    }
    writeDB(db);
    await ctx.reply(
      win
        ? `🎰 You won ${bet} points!\nBalance: ${u.coins.toLocaleString()}`
        : `💸 You lost ${bet} points.\nBalance: ${u.coins.toLocaleString()}`
    );
  }
};
