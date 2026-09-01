const { argsText } = require('../_utils');
module.exports = {
  name: "botinfo",
  aliases: [],
  category: "general",
  description: "Show technical bot information.",
  async execute(ctx) {
    await ctx.reply(`💎 PRIME BOT v2.1.0\nNode: ${process.version}\nPlatform: ${process.platform}\nPrefix: ${ctx.config.PREFIX || '.'}`);
  }
};
