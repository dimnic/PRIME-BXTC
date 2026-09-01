const { argsText } = require('../_utils');
module.exports = {
  name: "enhance",
  aliases: [],
  category: "media",
  description: "Enhance an image.",
  async execute(ctx) {
    await ctx.reply("Reply to an image with /enhance. Set IMAGE_ENHANCE_API_URL and IMAGE_ENHANCE_API_KEY.");
  }
};
