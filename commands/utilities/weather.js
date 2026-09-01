const axios=require('axios'); const {argsText}=require('../_utils');
module.exports={name:'weather',category:'utilities',description:'Get current weather.',async execute(ctx){
 const city=argsText(ctx.args); if(!city)return ctx.reply('Usage: /weather Lagos');
 const r=await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`,{timeout:15000});
 const c=r.data.current_condition?.[0]; if(!c)return ctx.reply('Weather unavailable.');
 await ctx.reply(`🌦️ ${city}\n🌡️ ${c.temp_C}°C (feels ${c.FeelsLikeC}°C)\n💧 Humidity: ${c.humidity}%\n💨 Wind: ${c.windspeedKmph} km/h\n☁️ ${c.weatherDesc?.[0]?.value||''}`);
}};
