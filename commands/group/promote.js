const { argsText } = require('../_utils');
module.exports = {
  name: "promote",
  aliases: [],
  category: "group",
  description: "Promote members.",
  async execute(ctx) {
    await requireAdmin(ctx); const targets=mentionsFrom(ctx); if(!targets.length)return ctx.reply('Mention the member.'); await ctx.sock.groupParticipantsUpdate(ctx.jid,targets,'promote'); await ctx.reply('⬆️ Promoted: '+targets.map(mention).join(', '));
  }
};
