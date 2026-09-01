const { argsText } = require('../_utils');
module.exports = {
  name: "tagall",
  aliases: [],
  category: "group",
  description: "Mention all members.",
  async execute(ctx) {
    await requireGroup(ctx); const md=await ctx.sock.groupMetadata(ctx.jid); const mentions=md.participants.map(p=>p.id); await ctx.sock.sendMessage(ctx.jid,{text:'📢 '+(argsText(ctx.args)||'Attention everyone!')+'\n\n'+mentions.map(mention).join(' '),mentions},{quoted:ctx.message});
  }
};
