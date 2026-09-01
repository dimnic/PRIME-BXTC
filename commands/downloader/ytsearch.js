const yts=require('yt-search'); const {argsText}=require('../_utils');
module.exports={name:'ytsearch',category:'downloader',description:'Search YouTube.',async execute(ctx){
 const q=argsText(ctx.args); if(!q)return ctx.reply('Usage: /ytsearch search terms');
 const r=await yts(q); const items=r.videos.slice(0,5).map((v,i)=>`${i+1}. ${v.title}\n${v.timestamp} • ${v.author.name}\n${v.url}`).join('\n\n');
 await ctx.reply(items||'No results.');
}};
