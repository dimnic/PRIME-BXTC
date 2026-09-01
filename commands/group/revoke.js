const { argsText } = require('../_utils');
module.exports = {
  name: "revoke",
  aliases: [],
  category: "group",
  description: "Revoke group invite link.",
  async execute(ctx) {
    await requireAdmin(ctx); await ctx.sock.groupRevokeInvite(ctx.jid); await ctx.reply('🔐 Group invite link revoked.');
  }
};
