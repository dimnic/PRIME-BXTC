const {randomInt,ensureJson,saveJson}=require('../_utils');
module.exports={name:'trivia',category:'games',description:'trivia game.',async execute(ctx){const q=[['What is the capital of Nigeria?','abuja'],['2+2=?','4'],['Largest planet?','jupiter']][randomInt(0,2)]; await ctx.reply(`🧠 ${q[0]}\nAnswer with /answer ${q[1]}`);}};
