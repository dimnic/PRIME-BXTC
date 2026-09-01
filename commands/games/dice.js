const {randomInt,ensureJson,saveJson}=require('../_utils');
module.exports={name:'dice',category:'games',description:'dice game.',async execute(ctx){const n=randomInt(1,6); await ctx.reply(`🎲 You rolled *${n}*`);}};
