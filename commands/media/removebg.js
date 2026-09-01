const { argsText } = require('../_utils');
module.exports = {
  name: "removebg",
  aliases: [],
  category: "media",
  description: "Remove an image background.",
  async execute(ctx) {
    await ctx.reply("Reply to an image with /removebg. Set REMOVE_BG_API_URL and REMOVE_BG_API_KEY.");
  }
};
