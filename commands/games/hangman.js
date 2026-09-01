const {randomInt,ensureJson,saveJson}=require('../_utils');
module.exports={name:'hangman',category:'games',description:'hangman game.',async execute(ctx){const words=['PRIME','whatsapp','bot','computer','nigeria']; const w=words[randomInt(0,words.length-1)]; await ctx.reply(`🔤 Hangman word length: ${w.length}\nFor this simple mode the word is: ${w}`);}};
