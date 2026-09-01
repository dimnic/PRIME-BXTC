const axios=require('axios'); const {argsText}=require('../_utils');
module.exports={name:'wiki',category:'utilities',description:'Search Wikipedia.',async execute(ctx){
 const q=argsText(ctx.args); if(!q)return ctx.reply('Usage: /wiki topic');
 const r=await axios.get('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(q),{timeout:15000});
 const d=r.data; await ctx.reply(`📚 ${d.title}\n\n${d.extract||'No summary.'}\n\n${d.content_urls?.desktop?.page||''}`);
}};
