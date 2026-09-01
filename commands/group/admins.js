const { argsText } = require('../_utils');
module.exports = {
  name: "admins",
  aliases: [],
  category: "group",
  description: "List admins.",
  async execute(ctx) {
    await requireGroup(ctx); const md=await ctx.sock.groupMetadata(ctx.jid); const a=md.participants.filter(p=>p.admin); await ctx.reply('👮 Admins:\n'+a.map(p=>mention(p.id)).join('\n'));
  }
};
