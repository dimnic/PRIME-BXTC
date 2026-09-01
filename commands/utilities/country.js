const axios=require('axios'); const {argsText}=require('../_utils');
module.exports={name:'country',category:'utilities',description:'Look up a country.',async execute(ctx){
 const q=argsText(ctx.args); if(!q)return ctx.reply('Usage: /country Nigeria');
 const r=await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(q)}`,{timeout:15000}); const d=r.data?.[0];
 await ctx.reply(`🌍 ${d.name?.common}\nCapital: ${d.capital?.[0]||'N/A'}\nRegion: ${d.region||'N/A'}\nPopulation: ${d.population?.toLocaleString()||'N/A'}\nCurrency: ${Object.keys(d.currencies||{})[0]||'N/A'}`);
}};
