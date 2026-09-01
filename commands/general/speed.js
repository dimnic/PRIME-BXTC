const { argsText } = require('../_utils');
module.exports = {
  name: "speed",
  aliases: [],
  category: "general",
  description: "Measure response speed.",
  async execute(ctx) {
    const t=Date.now(); await ctx.reply(`⚡ Speed: ${Date.now()-t} ms`);
  }
};
