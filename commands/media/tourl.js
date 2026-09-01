const { argsText } = require('../_utils');
module.exports = {
  name: "tourl",
  aliases: [],
  category: "media",
  description: "Upload replied media to a public URL.",
  async execute(ctx) {
    await ctx.reply("Reply to media with /tourl. A media-upload provider must be configured.");
  }
};
