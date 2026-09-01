const { argsText } = require('../_utils');
module.exports = {
  name: "tovideo",
  aliases: [],
  category: "media",
  description: "Convert media to video.",
  async execute(ctx) {
    await ctx.reply("Reply to media with /tovideo. This build requires ffmpeg for conversion.");
  }
};
