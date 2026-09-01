const { argsText } = require('../_utils');
module.exports = {
  name: "help",
  aliases: [],
  category: "general",
  description: "Show the command menu.",
  async execute(ctx) {
    await ctx.reply(ctx.menu());
  }
};
