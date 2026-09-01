const {randomInt,ensureJson,saveJson}=require('../_utils');
module.exports={name:'mathgame',category:'games',description:'mathgame game.',async execute(ctx){const a=randomInt(1,20),b=randomInt(1,20); await ctx.reply(`🧮 Solve: ${a} + ${b} = ?\nAnswer: ${a+b}`);}};
