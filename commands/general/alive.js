const { argsText } = require('../_utils');
module.exports = {
  name: "alive",
  aliases: [],
  category: "general",
  description: "Check whether the bot is online.",
  async execute(ctx) {
    await ctx.reply(`💎 PRIME BOT is alive.\n🟢 Online\n⏱️ ${ctx.runtime()}`);
  }
};
