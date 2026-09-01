const {requireAdmin,ensureJson,saveJson,argsText}=require('../_utils');
module.exports={name:'welcome',category:'protection',description:'Toggle welcome protection.',async execute(ctx){
 await requireAdmin(ctx);
 const a=(ctx.args?.[0]||'').toLowerCase();
 if(!['on','off','status'].includes(a)) return ctx.reply('Usage: /welcome on|off|status');
 const db=ensureJson('protection.json',{}); db[ctx.jid]=db[ctx.jid]||{};
 if(a==='status') return ctx.reply(`🛡️ welcome: ${db[ctx.jid].welcome?'on':'off'}`);
 db[ctx.jid].welcome=a==='on'; saveJson('protection.json',db);
 await ctx.reply(`🛡️ welcome: ${a}`);
}};
