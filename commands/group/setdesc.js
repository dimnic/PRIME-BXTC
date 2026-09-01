const { argsText } = require('../_utils');
module.exports = {
  name: "setdesc",
  aliases: [],
  category: "group",
  description: "Change group description.",
  async execute(ctx) {
    await requireAdmin(ctx); const d=argsText(ctx.args); if(!d)return ctx.reply('Usage: /setdesc description'); await ctx.sock.groupUpdateDescription(ctx.jid,d); await ctx.reply('✅ Group description updated.');
  }
};
