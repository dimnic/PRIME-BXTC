const {requireAdmin,ensureJson,saveJson,argsText}=require('../_utils');
module.exports={name:'antibot',category:'protection',description:'Toggle antibot protection.',async execute(ctx){
 await requireAdmin(ctx);
 const a=(ctx.args?.[0]||'').toLowerCase();
 if(!['on','off','status'].includes(a)) return ctx.reply('Usage: /antibot on|off|status');
 const db=ensureJson('protection.json',{}); db[ctx.jid]=db[ctx.jid]||{};
 if(a==='status') return ctx.reply(`🛡️ antibot: ${db[ctx.jid].antibot?'on':'off'}`);
 db[ctx.jid].antibot=a==='on'; saveJson('protection.json',db);
 await ctx.reply(`🛡️ antibot: ${a}`);
}};
