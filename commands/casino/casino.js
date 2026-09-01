'use strict';

module.exports = {
  name: 'casino',
  category: 'casino',
  description: 'Show casino commands (unified economy).',
  async execute(ctx) {
    await ctx.reply(
      `🎰 *PRIME Casino*\n` +
      `/balance — cash + bank\n` +
      `/daily — +500 coins\n` +
      `/gamble <points>\n` +
      `/leaderboard\n\n` +
      `All balances live in *data/users.json*\n` +
      `(edit in VS Code anytime).\n\n` +
      `Points are virtual only and have no cash value.`
    );
  }
};
