'use strict';
const { leaderboard } = require('../../core/user-store');

module.exports = {
  name: 'leaderboard',
  aliases: ['lb', 'top'],
  category: 'ECONOMY',
  description: 'Show the Prime Coins leaderboard (unified store).',
  async execute(ctx) {
    const rows = leaderboard(10);
    if (!rows.length) {
      return ctx.reply('🏆 *PRIME LEADERBOARD*\n\nNo players yet.');
    }
    const text = rows
      .map(
        (r, index) =>
          `${index + 1}. @${r.id} — ${(r.coins + r.bank).toLocaleString()} Prime Coins (Lv.${r.level})`
      )
      .join('\n');
    return ctx.reply(`🏆 *PRIME LEADERBOARD*\n\n${text}`, {
      mentions: rows.map((r) => `${r.id}@s.whatsapp.net`)
    });
  }
};
