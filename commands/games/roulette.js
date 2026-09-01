const {randomInt,ensureJson,saveJson}=require('../_utils');
module.exports={name:'roulette',category:'games',description:'roulette game.',async execute(ctx){const n=randomInt(0,36); await ctx.reply(`🎡 Roulette: *${n}*`);}};
