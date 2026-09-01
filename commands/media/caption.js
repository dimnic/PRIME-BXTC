const { argsText } = require('../_utils');
module.exports = {
  name: "caption",
  aliases: [],
  category: "media",
  description: "Add a caption to an image/video.",
  async execute(ctx) {
    const text=argsText(ctx.args); if(!text) return ctx.reply('Usage: /caption your caption'); if(!ctx.message?.message?.imageMessage && !ctx.message?.message?.videoMessage && !ctx.quoted) return ctx.reply('Reply to media with /caption.'); await ctx.reply(`Caption requested: ${text}`);
  }
};
