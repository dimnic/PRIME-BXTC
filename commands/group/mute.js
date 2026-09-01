const { argsText } = require('../_utils');
module.exports = {
  name: "mute",
  aliases: [],
  category: "group",
  description: "Mute group chat.",
  async execute(ctx) {
    await requireAdmin(ctx); await ctx.sock.groupSettingUpdate(ctx.jid,'announcement'); await ctx.reply('🔇 Group muted. Only admins can send messages.');
  }
};
