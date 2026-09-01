const QRCode=require('qrcode'); const {argsText}=require('../_utils');
module.exports={name:'qr',category:'utilities',description:'Generate a QR code.',async execute(ctx){
 const t=argsText(ctx.args); if(!t)return ctx.reply('Usage: /qr text or URL');
 const buf=await QRCode.toBuffer(t,{type:'png',width:700,margin:2});
 await ctx.sock.sendMessage(ctx.jid,{image:buf,caption:'📱 QR Code'},{quoted:ctx.message});
}};
