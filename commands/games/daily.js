'use strict';
const { readDB, writeDB, getUser } = require('../../core/user-store');

module.exports = {
  name: 'daily',
  category: 'games',
  description: 'Claim daily points (unified users.json store).',
  async execute(ctx) {
    const db = readDB();
    const u = getUser(db, ctx.sender);
    const key = 'daily';
    const cool = 24 * 60 * 60 * 1000;
    if (Date.now() - Number(u.last[key] || 0) < cool) {
      return ctx.reply('⏳ Daily already claimed. Come back tomorrow.');
    }
    u.coins += 100;
    u.last[key] = Date.now();
    writeDB(db);
    await ctx.reply(`🎁 Daily reward: +100 PRIME COINS!\nBalance: ${u.coins.toLocaleString()}`);
  }
};
