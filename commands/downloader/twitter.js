const { argsText } = require('../_utils');
module.exports = {
  name: "twitter",
  aliases: [],
  category: "downloader",
  description: "Downloader command hook.",
  async execute(ctx) {
    const u=argsText(ctx.args); if(!u) return ctx.reply('Usage: /twitter URL'); await ctx.reply('⚠️ This downloader needs a provider. The URL was received, but no external downloader is configured.');
  }
};
