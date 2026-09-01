const {argsText}=require('../_utils');
module.exports={name:"ai",category:'ai',description:"Ask the configured AI.",async execute(ctx){const axios = require('axios');
async function ask(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return '⚠️ AI is not configured. Add OPENAI_API_KEY to config.env.';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const r = await axios.post('https://api.openai.com/v1/chat/completions', {
    model, messages:[{role:'user',content:prompt}], temperature:0.7
  }, {headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'}, timeout:60000});
  return r.data?.choices?.[0]?.message?.content || 'No AI response.';
}
const prompt = argsText(ctx.args) || ctx.quotedText;
if (!prompt) return ctx.reply('Usage: /ai your prompt');
await ctx.reply(await ask(prompt));}};
