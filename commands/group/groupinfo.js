const { argsText } = require('../_utils');
module.exports = {
  name: "groupinfo",
  aliases: ["ginfo"],
  category: "group",
  description: "Show group information.",
  async execute(ctx) {
    await requireGroup(ctx); const md=await ctx.sock.groupMetadata(ctx.jid); await ctx.reply(`👥 ${md.subject}\nMembers: ${md.participants.length}\nOwner: ${md.owner?mention(md.owner):'N/A'}\nDescription: ${md.desc||'None'}`);
  }
};
