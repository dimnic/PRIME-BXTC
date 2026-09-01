const { argsText } = require('../_utils');
module.exports = {
  name: "owner",
  aliases: [],
  category: "general",
  description: "Show owner information.",
  async execute(ctx) {
    await ctx.reply(`👑 Owner: ${ctx.config.OWNER_NAME || 'PRIME Team'}\n📞 ${ctx.config.OWNER_NUMBER || 'not configured'}`);
  }
};
