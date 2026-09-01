const axios=require('axios'); const {argsText}=require('../_utils');
module.exports={name:'shortlink',aliases:['short'],category:'utilities',description:'Shorten a URL.',async execute(ctx){
 const u=argsText(ctx.args); if(!/^https?:\/\//i.test(u))return ctx.reply('Usage: /shortlink https://example.com');
 const r=await axios.get('https://tinyurl.com/api-create.php',{params:{url:u},timeout:15000}); await ctx.reply(`🔗 ${r.data}`);
}};
