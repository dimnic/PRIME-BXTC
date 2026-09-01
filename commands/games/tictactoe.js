const {randomInt,ensureJson,saveJson}=require('../_utils');
module.exports={name:'tictactoe',category:'games',description:'tictactoe game.',async execute(ctx){await ctx.reply('⭕❌ Tic-tac-toe quick mode: use /rps for a playable instant game. A persistent multiplayer board can be added to the game state store.');}};
