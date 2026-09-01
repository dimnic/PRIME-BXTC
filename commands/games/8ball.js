const {randomInt,ensureJson,saveJson}=require('../_utils');
module.exports={name:'8ball',category:'games',description:'8ball game.',async execute(ctx){const a=['Yes.','No.','Maybe.','Definitely.','Ask again later.','Probably not.']; await ctx.reply('🎱 '+a[randomInt(0,a.length-1)]);}};
