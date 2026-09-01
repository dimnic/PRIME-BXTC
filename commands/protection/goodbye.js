const {requireAdmin,ensureJson,saveJson,argsText}=require('../_utils');
module.exports={name:'goodbye',category:'protection',description:'Toggle goodbye protection.',async execute(ctx){
 await requireAdmin(ctx);
 const a=(ctx.args?.[0]||'').toLowerCase();
 if(!['on','off','status'].includes(a)) return ctx.reply('Usage: /goodbye on|off|status');
 const db=ensureJson('protection.json',{}); db[ctx.jid]=db[ctx.jid]||{};
 if(a==='status') return ctx.reply(`🛡️ goodbye: ${db[ctx.jid].goodbye?'on':'off'}`);
 db[ctx.jid].goodbye=a==='on'; saveJson('protection.json',db);
 await ctx.reply(`🛡️ goodbye: ${a}`);
}};
