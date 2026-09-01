const {requireAdmin,requireGroup,mentionsFrom,mention,ensureJson,saveJson}=require('../_utils');
module.exports={name:'warnings',category:'group',description:"Show warnings.",async execute(ctx){await requireGroup(ctx); const t=mentionsFrom(ctx); const id=t[0]||ctx.sender; const db=ensureJson('warnings.json',{}); await ctx.reply(`${mention(id)} has ${db[id]||0} warning(s).`);}};
