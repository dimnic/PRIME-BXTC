const {requireAdmin,ensureJson,saveJson,argsText}=require('../_utils');
module.exports={name:'setgoodbye',category:'protection',description:'Set goodbyeText.',async execute(ctx){
 await requireAdmin(ctx); const t=argsText(ctx.args); if(!t)return ctx.reply('Usage: /setgoodbye your message');
 const db=ensureJson('protection.json',{}); db[ctx.jid]=db[ctx.jid]||{}; db[ctx.jid].goodbyeText=t; saveJson('protection.json',db); await ctx.reply('✅ Saved.');
}};
