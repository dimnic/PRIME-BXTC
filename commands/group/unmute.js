'use strict';

module.exports = {
    name: 'unmute',
    aliases: ['unmutechat'],
    category: 'group',
    description: 'Unmute the group so everyone can send messages.',

    async execute(ctx) {
        try {
            if (!ctx.isGroup) {
                return ctx.reply('❌ This command can only be used in a group.');
            }

            // Check command user admin status
            if (!ctx.isGroupAdmin) {
                return ctx.reply('❌ Only group admins can use this command.');
            }

            // Check bot admin status
            if (!ctx.isBotAdmin) {
                return ctx.reply('❌ I need to be a group admin to unmute this group.');
            }

            await ctx.sock.groupSettingUpdate(
                ctx.jid,
                'not_announcement'
            );

            return ctx.reply(
                '🔊 *GROUP UNMUTED*\n\n' +
                'Everyone can send messages again.'
            );

        } catch (error) {
            console.error('UNMUTE ERROR:', error);

            return ctx.reply(
                '❌ Failed to unmute the group.\n\n' +
                `Error: ${error.message}`
            );
        }
    }
};