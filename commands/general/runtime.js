const { argsText } = require('../_utils');
module.exports = {
  name: "runtime",
  aliases: [],
  category: "general",
  description: "Show bot uptime.",
  async execute(ctx) {
    await ctx.reply(`⏱️ Runtime: ${ctx.runtime()}`);
  }
};
