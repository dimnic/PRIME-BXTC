const { argsText } = require('../_utils');
module.exports = {
  name: "about",
  aliases: [],
  category: "general",
  description: "Show bot information.",
  async execute(ctx) {
    await ctx.reply(`💎 *PRIME BOT*\nVersion: 2.1.0\nMode: public\nPrefix: ${ctx.config.PREFIX || '.'}`);
  }
};
