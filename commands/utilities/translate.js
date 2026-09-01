const axios=require('axios'); const {argsText}=require('../_utils');
module.exports={name:'translate',category:'utilities',description:'Translate text.',async execute(ctx){
 const a=ctx.args||[]; if(a.length<2)return ctx.reply('Usage: /translate en hola mundo');
 const target=a.shift(); const text=a.join(' ');
 const r=await axios.get('https://translate.googleapis.com/translate_a/single',{params:{client:'gtx',sl:'auto',tl:target,dt:'t',q:text},timeout:15000});
 await ctx.reply(`🌐 ${r.data?.[0]?.map(x=>x[0]).join('')||'Translation unavailable.'}`);
}};
