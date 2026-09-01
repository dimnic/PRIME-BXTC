const {requireAdmin,ensureJson,saveJson,argsText}=require('../_utils');
module.exports={name:'mutechat',category:'protection',description:'Toggle mutechat protection.',async execute(ctx){
 await requireAdmin(ctx);
 const a=(ctx.args?.[0]||'').toLowerCase();
 if(!['on','off','status'].includes(a)) return ctx.reply('Usage: /mutechat on|off|status');
 const db=ensureJson('protection.json',{}); db[ctx.jid]=db[ctx.jid]||{};
 if(a==='status') return ctx.reply(`🛡️ mutechat: ${db[ctx.jid].mutechat?'on':'off'}`);
 db[ctx.jid].mutechat=a==='on'; saveJson('protection.json',db);
 await ctx.reply(`🛡️ mutechat: ${a}`);
}};
