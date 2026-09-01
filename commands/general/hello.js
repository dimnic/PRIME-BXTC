const { argsText } = require('../_utils');
module.exports = {
  name: "hello",
  aliases: [],
  category: "general",
  description: "Say hello.",
  async execute(ctx) {
    await ctx.reply(`Hello ${ctx.pushName || ''}! 👋\n💎 Prime Bot is online.`);
  }
};
