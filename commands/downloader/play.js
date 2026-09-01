const yts=require('yt-search'); const {argsText}=require('../_utils');
module.exports={name:'play',category:'downloader',description:'Find a YouTube video for play.',async execute(ctx){
 const q=argsText(ctx.args); if(!q)return ctx.reply('Usage: /play song/video name');
 const r=await yts(q); const v=r.videos?.[0]; if(!v)return ctx.reply('No result found.');
 await ctx.reply(`🎵 ${v.title}\n⏱️ ${v.timestamp}\n🔗 ${v.url}\n\nTo enable actual audio/video downloads, install/configure yt-dlp on the server.`);
}};
