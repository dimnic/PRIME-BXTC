const {requireAdmin,ensureJson,saveJson,argsText}=require('../_utils');
module.exports={name:'antitag',category:'protection',description:'Toggle antitag protection.',async execute(ctx){
 await requireAdmin(ctx);
 const a=(ctx.args?.[0]||'').toLowerCase();
 if(!['on','off','status'].includes(a)) return ctx.reply('Usage: /antitag on|off|status');
 const db=ensureJson('protection.json',{}); db[ctx.jid]=db[ctx.jid]||{};
 if(a==='status') return ctx.reply(`🛡️ antitag: ${db[ctx.jid].antitag?'on':'off'}`);
 db[ctx.jid].antitag=a==='on'; saveJson('protection.json',db);
 await ctx.reply(`🛡️ antitag: ${a}`);
}};
