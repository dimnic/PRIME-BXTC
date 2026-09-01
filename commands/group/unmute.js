const { argsText } = require('../_utils');
module.exports = {
  name: "unmute",
  aliases: [],
  category: "group",
  description: "Unmute group chat.",
  async execute(ctx) {
    await requireAdmin(ctx); await ctx.sock.groupSettingUpdate(ctx.jid,'not_announcement'); await ctx.reply('🔊 Group unmuted.');
  }
};
