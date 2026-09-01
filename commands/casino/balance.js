'use strict';
const { readDB, writeDB, getUser } = require('../../core/user-store');

module.exports = {
  name: 'balance',
  aliases: ['bal'],
  category: 'casino',
  description: 'Show points / Prime Coins balance (unified store).',
  async execute(ctx) {
    const db = readDB();
    const u = getUser(db, ctx.sender);
    writeDB(db);
    await ctx.reply(
      `💰 *PRIME BALANCE*\n\n` +
      `Cash: *${u.coins.toLocaleString()}* PRIME COINS\n` +
      `Bank: *${u.bank.toLocaleString()}*\n` +
      `Level: ${u.level} | XP: ${u.xp}`
    );
  }
};
