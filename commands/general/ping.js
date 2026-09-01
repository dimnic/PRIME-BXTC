const { argsText } = require('../_utils');
module.exports = {
  name: "ping",
  aliases: [],
  category: "general",
  description: "Check bot response.",
  async execute(ctx) {
    const t=Date.now(); await ctx.reply(`🏓 Pong!\n⚡ ${Date.now()-t} ms`);
  }
};
