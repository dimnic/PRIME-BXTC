const {randomInt,ensureJson,saveJson}=require('../_utils');
module.exports={name:'guess',category:'games',description:'guess game.',async execute(ctx){const n=randomInt(1,10); const g=Number(ctx.args?.[0]); if(!g)return ctx.reply('Guess a number 1-10: /guess 7'); await ctx.reply(g===n?`🎯 Correct! It was ${n}.`:`❌ Nope. It was ${n}.`);}};
