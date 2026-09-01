const { Sticker, StickerTypes } = require('wa-sticker-formatter');
module.exports={name:'sticker',aliases:['s'],category:'media',description:'Turn a replied image/video into a sticker.',async execute(ctx){
  const m=ctx.message?.message;
  const has=m?.imageMessage||m?.videoMessage||ctx.quoted?.message?.imageMessage||ctx.quoted?.message?.videoMessage;
  if(!has) return ctx.reply('Reply to an image or short video with /sticker.');
  const target=ctx.quoted?.raw || ctx.message;
  const buf=await ctx.sock.downloadMediaMessage(target,'buffer',{}, {logger:ctx.logger});
  const sticker=await new Sticker(buf,{pack:ctx.config.STICKER_PACKNAME||'Prime Bot',author:ctx.config.STICKER_AUTHOR||'💎 Prime Bot',type:StickerTypes.FULL,quality:60}).build();
  await ctx.sock.sendMessage(ctx.jid,{sticker},{quoted:ctx.message});
}};
