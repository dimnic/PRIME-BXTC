const { argsText } = require('../_utils');
module.exports = {
  name: "link",
  aliases: [],
  category: "group",
  description: "Get group invite link.",
  async execute(ctx) {
    await requireAdmin(ctx); const code=await ctx.sock.groupInviteCode(ctx.jid); await ctx.reply('🔗 https://chat.whatsapp.com/'+code);
  }
};
