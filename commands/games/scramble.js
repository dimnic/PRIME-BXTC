const {randomInt,ensureJson,saveJson}=require('../_utils');
module.exports={name:'scramble',category:'games',description:'scramble game.',async execute(ctx){const words=['PRIME','whatsapp','javascript','computer','telegram']; const w=words[randomInt(0,words.length-1)]; const s=w.split('').sort(()=>Math.random()-.5).join(''); await ctx.reply(`🔀 Unscramble: *${s}*\nAnswer: ${w}`);}};
