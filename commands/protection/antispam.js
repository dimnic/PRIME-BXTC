const {requireAdmin,ensureJson,saveJson,argsText}=require('../_utils');
module.exports={name:'antispam',category:'protection',description:'Toggle antispam protection.',async execute(ctx){
 await requireAdmin(ctx);
 const a=(ctx.args?.[0]||'').toLowerCase();
 if(!['on','off','status'].includes(a)) return ctx.reply('Usage: /antispam on|off|status');
 const db=ensureJson('protection.json',{}); db[ctx.jid]=db[ctx.jid]||{};
 if(a==='status') return ctx.reply(`🛡️ antispam: ${db[ctx.jid].antispam?'on':'off'}`);
 db[ctx.jid].antispam=a==='on'; saveJson('protection.json',db);
 await ctx.reply(`🛡️ antispam: ${a}`);
}};
