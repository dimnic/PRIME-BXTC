const { argsText } = require('../_utils');
module.exports = {
  name: "repo",
  aliases: [],
  category: "general",
  description: "Show the repository URL.",
  async execute(ctx) {
    await ctx.reply(ctx.config.REPO_URL || 'Repository URL is not configured.');
  }
};
