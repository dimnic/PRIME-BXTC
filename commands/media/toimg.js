const { argsText } = require('../_utils');
module.exports = {
  name: "toimg",
  aliases: [],
  category: "media",
  description: "Convert a sticker/media to an image.",
  async execute(ctx) {
    await ctx.reply("Reply to a sticker/media with /toimg. This build requires ffmpeg for conversion.");
  }
};
