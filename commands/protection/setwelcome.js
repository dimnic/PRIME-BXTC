const {requireAdmin,ensureJson,saveJson,argsText}=require('../_utils');
module.exports={name:'setwelcome',category:'protection',description:'Set welcomeText.',async execute(ctx){
 await requireAdmin(ctx); const t=argsText(ctx.args); if(!t)return ctx.reply('Usage: /setwelcome your message');
 const db=ensureJson('protection.json',{}); db[ctx.jid]=db[ctx.jid]||{}; db[ctx.jid].welcomeText=t; saveJson('protection.json',db); await ctx.reply('✅ Saved.');
}};
