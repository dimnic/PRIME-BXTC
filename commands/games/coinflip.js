const {randomInt,ensureJson,saveJson}=require('../_utils');
module.exports={name:'coinflip',category:'games',description:'coinflip game.',async execute(ctx){const side=(Math.random()<.5?'heads':'tails'); await ctx.reply(`🪙 ${side.toUpperCase()}`);}};
