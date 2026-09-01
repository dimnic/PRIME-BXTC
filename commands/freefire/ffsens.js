const {argsText}=require('../_utils');
module.exports={name:'ffsens',aliases:['ffsensitivity'],category:'freefire',description:'Get Free Fire sensitivity.',async execute(ctx){
 const d=argsText(ctx.args).toLowerCase()||'generic'; const p=d.includes('low')?{general:95,red:90,'2x':85,'4x':75,awm:55,free:70}:{general:98,red:94,'2x':90,'4x':82,awm:60,free:78};
 await ctx.reply(`🎯 Free Fire sensitivity (${d})\nGeneral: ${p.general}\nRed Dot: ${p.red}\n2x: ${p['2x']}\n4x: ${p['4x']}\nAWM: ${p.awm}\nFree Look: ${p.free}\n\nThese are starting values; tune them to your device/touch response.`);
}};
