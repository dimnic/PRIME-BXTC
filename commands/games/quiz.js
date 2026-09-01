const {randomInt,ensureJson,saveJson}=require('../_utils');
module.exports={name:'quiz',category:'games',description:'quiz game.',async execute(ctx){const q=[['Which planet is known as the Red Planet?','mars'],['How many continents are there?','7'],['HTML stands for?','hypertext markup language']][randomInt(0,2)]; await ctx.reply(`❓ ${q[0]}\nCorrect answer: ${q[1]}`);}};
