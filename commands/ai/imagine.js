const {argsText}=require('../_utils');
module.exports={name:"imagine",category:'ai',description:"Image-generation hook; requires an external image provider.",async execute(ctx){const axios = require('axios');
async function ask(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return '⚠️ AI is not configured. Add OPENAI_API_KEY to config.env.';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const r = await axios.post('https://api.openai.com/v1/chat/completions', {
    model, messages:[{role:'user',content:prompt}], temperature:0.7
  }, {headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'}, timeout:60000});
  return r.data?.choices?.[0]?.message?.content || 'No AI response.';
}
const prompt=argsText(ctx.args);
if (!prompt) return ctx.reply('Usage: /imagine your prompt');
if (!process.env.IMAGE_API_URL) return ctx.reply('⚠️ Image generation is not configured. Set IMAGE_API_URL and IMAGE_API_KEY.');
await ctx.reply('Image provider is configured but this command needs the provider-specific request format.');}};
