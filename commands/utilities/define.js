const axios=require('axios'); const {argsText}=require('../_utils');
module.exports={name:'define',category:'utilities',description:'Define an English word.',async execute(ctx){
 const q=argsText(ctx.args); if(!q)return ctx.reply('Usage: /define word');
 const r=await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`,{timeout:15000});
 const d=r.data?.[0]; const m=d?.meanings?.[0]; const def=m?.definitions?.[0];
 await ctx.reply(`📖 ${d?.word||q}\n${m?.partOfSpeech||''}\n${def?.definition||'No definition found.'}`);
}};
