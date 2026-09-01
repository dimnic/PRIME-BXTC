const {argsText}=require('../_utils');
module.exports={name:'time',category:'utilities',description:'Show time for a UTC offset.',async execute(ctx){
 const q=argsText(ctx.args)||'local'; await ctx.reply(`🕒 ${q}: ${new Date().toLocaleString('en-GB',{timeZone: q==='local'?undefined:'UTC'})}`);
}};
