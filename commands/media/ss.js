const { argsText } = require('../_utils');
module.exports = {
  name: "ss",
  aliases: [],
  category: "media",
  description: "Take a webpage screenshot.",
  async execute(ctx) {
    await ctx.reply("Usage: /ss https://example.com. Set SCREENSHOT_API_URL for a provider.");
  }
};
