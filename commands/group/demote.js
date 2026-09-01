const { argsText } = require('../_utils');
module.exports = {
  name: "demote",
  aliases: [],
  category: "group",
  description: "Demote admins.",
  async execute(ctx) {
    await requireAdmin(ctx); const targets=mentionsFrom(ctx); if(!targets.length)return ctx.reply('Mention the admin.'); await ctx.sock.groupParticipantsUpdate(ctx.jid,targets,'demote'); await ctx.reply('⬇️ Demoted: '+targets.map(mention).join(', '));
  }
};
