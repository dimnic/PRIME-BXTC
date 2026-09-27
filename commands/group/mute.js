'use strict';

module.exports = {
    name: 'mute',
    aliases: [],
    category: 'group',
    description: 'Mute the group so only admins can send messages.',

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
                return ctx.reply('❌ I need to be a group admin to mute this group.');
            }

            await ctx.sock.groupSettingUpdate(
                ctx.jid,
                'announcement'
            );

            return ctx.reply(
                '🔇 *GROUP MUTED*\n\n' +
                'Only group admins can send messages now.'
            );

        } catch (error) {
            console.error('MUTE ERROR:', error);

            return ctx.reply(
                '❌ Failed to mute the group.\n\n' +
                `Error: ${error.message}`
            );
        }
    }
};