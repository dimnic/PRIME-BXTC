const {argsText}=require('../_utils');
module.exports={name:'calc',category:'utilities',description:'Calculate arithmetic.',async execute(ctx){
 const s=argsText(ctx.args); if(!s)return ctx.reply('Usage: /calc 2*(5+3)');
 if(!/^[0-9+\-*/%().,\s^]+$/.test(s)) return ctx.reply('❌ Only basic arithmetic is allowed.');
 try { const expr=s.replace(/\^/g,'**'); const value=Function(`"use strict"; return (${expr})`)(); if(!Number.isFinite(value)) throw new Error(); await ctx.reply(`🧮 ${s} = ${value}`); } catch { await ctx.reply('❌ Invalid calculation.'); }
}};
