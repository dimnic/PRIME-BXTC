const {requireAdmin,ensureJson,saveJson,argsText}=require('../_utils');
module.exports={name:'antilink',category:'protection',description:'Toggle antilink protection.',async execute(ctx){
 await requireAdmin(ctx);
 const a=(ctx.args?.[0]||'').toLowerCase();
 if(!['on','off','status'].includes(a)) return ctx.reply('Usage: /antilink on|off|status');
 const db=ensureJson('protection.json',{}); db[ctx.jid]=db[ctx.jid]||{};
 if(a==='status') return ctx.reply(`🛡️ antilink: ${db[ctx.jid].antilink?'on':'off'}`);
 db[ctx.jid].antilink=a==='on'; saveJson('protection.json',db);
 await ctx.reply(`🛡️ antilink: ${a}`);
}};
