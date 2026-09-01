'use strict';
const { readDB, writeDB, getUser } = require('../../core/user-store');

module.exports = {
  name: 'daily',
  category: 'casino',
  description: 'Claim daily points (unified store).',
  async execute(ctx) {
    const db = readDB();
    const u = getUser(db, ctx.sender);
    const key = 'daily';
    const cool = 24 * 60 * 60 * 1000;
    const last = Number(u.last[key] || 0);
    if (Date.now() - last < cool) {
      return ctx.reply('⏳ Daily already claimed. Try again later.');
    }
    u.coins += 500;
    u.last[key] = Date.now();
    writeDB(db);
    await ctx.reply(`🎁 +500 PRIME COINS!\nBalance: ${u.coins.toLocaleString()}`);
  }
};
