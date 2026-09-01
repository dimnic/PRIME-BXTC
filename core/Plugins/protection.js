
'use strict';

/*
|--------------------------------------------------------------------------
| PRIME BOT - PROTECTION
|--------------------------------------------------------------------------
*/

function getGroupId(jid) {
    return jid && jid.endsWith('@g.us')
        ? jid
        : null;
}

function requireGroup(context) {
    if (!context.isGroup) {
        context.reply('❌ This command can only be used in a group.');
        return false;
    }

    return true;
}

function requireAdmin(context) {
    if (!context.isGroupAdmin && !context.isOwner && !context.isSudo) {
        context.reply('❌ Only group admins can use this command.');
        return false;
    }

    return true;
}

function getStatus(set, jid) {
    return set.has(jid) ? 'ON 🟢' : 'OFF 🔴';
}

module.exports = [
    {
        name: 'antilink',
        aliases: ['antilink'],
        description: 'Enable or disable anti-link protection',
        category: 'PROTECTION',

        async execute(context) {
            if (!requireGroup(context)) return;
            if (!requireAdmin(context)) return;

            const jid = getGroupId(context.jid);

            if (!jid) return;

            const action =
                String(context.args[0] || '').toLowerCase();

            if (
                action === 'on' ||
                action === 'enable'
            ) {
                global.antilink.add(jid);

                return context.reply(
                    '🛡️ *ANTILINK ENABLED*\n\n' +
                    'Group link protection is now ON.'
                );
            }

            if (
                action === 'off' ||
                action === 'disable'
            ) {
                global.antilink.delete(jid);

                return context.reply(
                    '🛡️ *ANTILINK DISABLED*\n\n' +
                    'Group link protection is now OFF.'
                );
            }

            return context.reply(
                `🛡️ *ANTILINK*\n\n` +
                `Status: ${getStatus(global.antilink, jid)}\n\n` +
                `Use:\n` +
                `/antilink on\n` +
                `/antilink off`
            );
        }
    },

    {
        name: 'antispam',
        description: 'Enable or disable anti-spam protection',
        category: 'PROTECTION',

        async execute(context) {
            if (!requireGroup(context)) return;
            if (!requireAdmin(context)) return;

            const jid = getGroupId(context.jid);
            if (!jid) return;

            const action =
                String(context.args[0] || '').toLowerCase();

            if (
                action === 'on' ||
                action === 'enable'
            ) {
                global.antispam.add(jid);

                return context.reply(
                    '🛡️ *ANTISPAM ENABLED*\n\n' +
                    'Anti-spam protection is now ON.'
                );
            }

            if (
                action === 'off' ||
                action === 'disable'
            ) {
                global.antispam.delete(jid);

                return context.reply(
                    '🛡️ *ANTISPAM DISABLED*\n\n' +
                    'Anti-spam protection is now OFF.'
                );
            }

            return context.reply(
                `🛡️ *ANTISPAM*\n\n` +
                `Status: ${getStatus(global.antispam, jid)}\n\n` +
                `Use:\n` +
                `/antispam on\n` +
                `/antispam off`
            );
        }
    },

    {
        name: 'antitag',
        description: 'Enable or disable anti-tag protection',
        category: 'PROTECTION',

        async execute(context) {
            if (!requireGroup(context)) return;
            if (!requireAdmin(context)) return;

            const jid = getGroupId(context.jid);
            if (!jid) return;

            const action =
                String(context.args[0] || '').toLowerCase();

            if (
                action === 'on' ||
                action === 'enable'
            ) {
                global.antitag.add(jid);

                return context.reply(
                    '🛡️ *ANTITAG ENABLED*\n\n' +
                    'Anti-tag protection is now ON.'
                );
            }

            if (
                action === 'off' ||
                action === 'disable'
            ) {
                global.antitag.delete(jid);

                return context.reply(
                    '🛡️ *ANTITAG DISABLED*\n\n' +
                    'Anti-tag protection is now OFF.'
                );
            }

            return context.reply(
                `🛡️ *ANTITAG*\n\n` +
                `Status: ${getStatus(global.antitag, jid)}\n\n` +
                `Use:\n` +
                `/antitag on\n` +
                `/antitag off`
            );
        }
    },

    {
        name: 'antibot',
        description: 'Enable or disable anti-bot protection',
        category: 'PROTECTION',

        async execute(context) {
            if (!requireGroup(context)) return;
            if (!requireAdmin(context)) return;

            const jid = getGroupId(context.jid);
            if (!jid) return;

            const action =
                String(context.args[0] || '').toLowerCase();

            if (
                action === 'on' ||
                action === 'enable'
            ) {
                global.antibot.add(jid);

                return context.reply(
                    '🛡️ *ANTIBOT ENABLED*\n\n' +
                    'Anti-bot protection is now ON.'
                );
            }

            if (
                action === 'off' ||
                action === 'disable'
            ) {
                global.antibot.delete(jid);

                return context.reply(
                    '🛡️ *ANTIBOT DISABLED*\n\n' +
                    'Anti-bot protection is now OFF.'
                );
            }

            return context.reply(
                `🛡️ *ANTIBOT*\n\n` +
                `Status: ${getStatus(global.antibot, jid)}\n\n` +
                `Use:\n` +
                `/antibot on\n` +
                `/antibot off`
            );
        }
    },

    {
        name: 'welcome',
        description: 'Enable or disable welcome messages',
        category: 'PROTECTION',

        async execute(context) {
            if (!requireGroup(context)) return;
            if (!requireAdmin(context)) return;

            const jid = getGroupId(context.jid);
            if (!jid) return;

            const action =
                String(context.args[0] || '').toLowerCase();

            if (
                action === 'on' ||
                action === 'enable'
            ) {
                global.welcome[jid] = true;

                return context.reply(
                    '👋 *WELCOME ENABLED*\n\n' +
                    'New members will receive a welcome message.'
                );
            }

            if (
                action === 'off' ||
                action === 'disable'
            ) {
                delete global.welcome[jid];

                return context.reply(
                    '👋 *WELCOME DISABLED*'
                );
            }

            return context.reply(
                `👋 *WELCOME*\n\n` +
                `Status: ${global.welcome[jid] ? 'ON 🟢' : 'OFF 🔴'}\n\n` +
                `Use:\n` +
                `/welcome on\n` +
                `/welcome off`
            );
        }
    },

    {
        name: 'goodbye',
        description: 'Enable or disable goodbye messages',
        category: 'PROTECTION',

        async execute(context) {
            if (!requireGroup(context)) return;
            if (!requireAdmin(context)) return;

            const jid = getGroupId(context.jid);
            if (!jid) return;

            const action =
                String(context.args[0] || '').toLowerCase();

            if (
                action === 'on' ||
                action === 'enable'
            ) {
                global.goodbye[jid] = true;

                return context.reply(
                    '👋 *GOODBYE ENABLED*\n\n' +
                    'Members leaving the group will receive a goodbye message.'
                );
            }

            if (
                action === 'off' ||
                action === 'disable'
            ) {
                delete global.goodbye[jid];

                return context.reply(
                    '👋 *GOODBYE DISABLED*'
                );
            }

            return context.reply(
                `👋 *GOODBYE*\n\n` +
                `Status: ${global.goodbye[jid] ? 'ON 🟢' : 'OFF 🔴'}\n\n` +
                `Use:\n` +
                `/goodbye on\n` +
                `/goodbye off`
            );
        }
    },

    {
        name: 'setwelcome',
        description: 'Set custom welcome message',
        category: 'PROTECTION',

        async execute(context) {
            if (!requireGroup(context)) return;
            if (!requireAdmin(context)) return;

            const jid = getGroupId(context.jid);
            if (!jid) return;

            const text = context.text.trim();

            if (!text) {
                return context.reply(
                    '❌ Give me the welcome message.\n\n' +
                    'Example:\n' +
                    '/setwelcome Welcome @{user} to the group! 👋'
                );
            }

            global.welcomeMsg[jid] = text;

            return context.reply(
                '✅ *WELCOME MESSAGE UPDATED*\n\n' +
                text
            );
        }
    },

    {
        name: 'setgoodbye',
        description: 'Set custom goodbye message',
        category: 'PROTECTION',

        async execute(context) {
            if (!requireGroup(context)) return;
            if (!requireAdmin(context)) return;

            const jid = getGroupId(context.jid);
            if (!jid) return;

            const text = context.text.trim();

            if (!text) {
                return context.reply(
                    '❌ Give me the goodbye message.\n\n' +
                    'Example:\n' +
                    '/setgoodbye Goodbye @{user} 👋'
                );
            }

            global.goodbyeMsg[jid] = text;

            return context.reply(
                '✅ *GOODBYE MESSAGE UPDATED*\n\n' +
                text
            );
        }
    },

    {
        name: 'protection',
        aliases: ['protect'],
        description: 'Show protection settings',
        category: 'PROTECTION',

        async execute(context) {
            if (!requireGroup(context)) return;

            const jid = getGroupId(context.jid);

            return context.reply(
                `╭━━━〔 🛡️ PROTECTION 〕━━━╮
┃
┃ Antilink  : ${getStatus(global.antilink, jid)}
┃ Antispam  : ${getStatus(global.antispam, jid)}
┃ Antitag   : ${getStatus(global.antitag, jid)}
┃ Antibot   : ${getStatus(global.antibot, jid)}
┃ Welcome   : ${global.welcome[jid] ? 'ON 🟢' : 'OFF 🔴'}
┃ Goodbye   : ${global.goodbye[jid] ? 'ON 🟢' : 'OFF 🔴'}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

Use:
• /antilink on
• /antispam on
• /antitag on
• /antibot on
• /welcome on
• /goodbye on`
            );
        }
    }
];
