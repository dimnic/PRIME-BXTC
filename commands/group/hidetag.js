const { argsText } = require('../_utils');
module.exports = {
  name: "hidetag",
  aliases: [],
  category: "group",
  description: "Mention all without showing tags.",
  async execute(ctx) {
    await requireAdmin(ctx); const md=await ctx.sock.groupMetadata(ctx.jid); const mentions=md.participants.map(p=>p.id); await ctx.sock.sendMessage(ctx.jid,{text:argsText(ctx.args)||'👀',mentions},{quoted:ctx.message});
  }
};
