const { argsText } = require('../_utils');
module.exports = {
  name: "add",
  aliases: [],
  category: "group",
  description: "Add a member.",
  async execute(ctx) {
    await requireAdmin(ctx); const nums=(ctx.args||[]).map(x=>x.replace(/\D/g,'')).filter(Boolean); if(!nums.length)return ctx.reply('Usage: /add 234xxxxxxxxxx'); const ids=nums.map(x=>x+'@s.whatsapp.net'); await ctx.sock.groupParticipantsUpdate(ctx.jid,ids,'add'); await ctx.reply('➕ Add request sent.');
  }
};
