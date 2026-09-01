const { argsText } = require('../_utils');
module.exports = {
  name: "setname",
  aliases: [],
  category: "group",
  description: "Change group name.",
  async execute(ctx) {
    await requireAdmin(ctx); const n=argsText(ctx.args); if(!n)return ctx.reply('Usage: /setname New Name'); await ctx.sock.groupUpdateSubject(ctx.jid,n); await ctx.reply('✅ Group name updated.');
  }
};
