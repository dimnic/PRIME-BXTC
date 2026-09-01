const { argsText } = require('../_utils');
module.exports = {
  name: "kick",
  aliases: [],
  category: "group",
  description: "Remove group members.",
  async execute(ctx) {
    await requireAdmin(ctx); const targets=mentionsFrom(ctx); if(!targets.length)return ctx.reply('Mention the member to kick.'); await ctx.sock.groupParticipantsUpdate(ctx.jid,targets,'remove'); await ctx.reply('👢 Removed: '+targets.map(mention).join(', '));
  }
};
