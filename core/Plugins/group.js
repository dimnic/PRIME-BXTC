async function requireGroup(reply, isGroup) {
    if (!isGroup) {
        await reply('❌ This command only works in groups.');
        return false;
    }

    return true;
}

async function requireAdmin(reply, isGroupAdmin) {
    if (!isGroupAdmin) {
        await reply('❌ You must be a group admin.');
        return false;
    }

    return true;
}

module.exports = [
    {
        name: 'groupinfo',
        alias: ['ginfo'],
        description: 'Show group information',
        category: 'GROUP',

        async execute({ reply, isGroup, groupMetadata }) {
            if (!(await requireGroup(reply, isGroup))) return;

            await reply(
                `👥 *GROUP INFO*\n\n` +
                `Name: ${groupMetadata?.subject || 'Unknown'}\n` +
                `Members: ${groupMetadata?.participants?.length || 0}\n` +
                `ID: ${groupMetadata?.id || 'Unknown'}`
            );
        }
    },

    {
        name: 'admins',
        description: 'List group admins',
        category: 'GROUP',

        async execute({ reply, isGroup, groupMetadata }) {
            if (!(await requireGroup(reply, isGroup))) return;

            const admins =
                (groupMetadata?.participants || [])
                    .filter(p =>
                        p.admin === 'admin' ||
                        p.admin === 'superadmin'
                    )
                    .map(p => `@${p.id.split('@')[0]}`);

            await reply(
                `👑 *GROUP ADMINS*\n\n` +
                (admins.length ? admins.join('\n') : 'No admins found.')
            );
        }
    },

    {
        name: 'tagall',
        alias: ['everyone'],
        description: 'Mention everyone',
        category: 'GROUP',

        async execute({ sock, jid, isGroup, groupMetadata, reply }) {
            if (!(await requireGroup(reply, isGroup))) return;

            const participants =
                groupMetadata?.participants || [];

            const mentions =
                participants.map(p => p.id);

            const text =
                `📢 *TAG ALL*\n\n` +
                participants
                    .map(p => `@${p.id.split('@')[0]}`)
                    .join(' ');

            await sock.sendMessage(jid, {
                text,
                mentions
            });
        }
    },

    {
        name: 'hidetag',
        description: 'Mention everyone silently',
        category: 'GROUP',

        async execute({ sock, jid, isGroup, groupMetadata, reply, text }) {
            if (!(await requireGroup(reply, isGroup))) return;

            const participants =
                groupMetadata?.participants || [];

            await sock.sendMessage(jid, {
                text: text || '📢',
                mentions: participants.map(p => p.id)
            });
        }
    },

    {
        name: 'setname',
        description: 'Change group name',
        category: 'GROUP',

        async execute({ sock, jid, reply, isGroup, isGroupAdmin, text }) {
            if (!(await requireGroup(reply, isGroup))) return;
            if (!(await requireAdmin(reply, isGroupAdmin))) return;

            if (!text) {
                return reply('✏️ Usage: /setname New Group Name');
            }

            try {
                await sock.groupUpdateSubject(jid, text);
                await reply('✅ Group name updated.');
            } catch {
                await reply('❌ Failed to change group name.');
            }
        }
    },

    {
        name: 'setdesc',
        description: 'Change group description',
        category: 'GROUP',

        async execute({ sock, jid, reply, isGroup, isGroupAdmin, text }) {
            if (!(await requireGroup(reply, isGroup))) return;
            if (!(await requireAdmin(reply, isGroupAdmin))) return;

            if (!text) {
                return reply('✏️ Usage: /setdesc New description');
            }

            try {
                await sock.groupUpdateDescription(jid, text);
                await reply('✅ Group description updated.');
            } catch {
                await reply('❌ Failed to change description.');
            }
        }
    },

    {
        name: 'link',
        description: 'Get group invite link',
        category: 'GROUP',

        async execute({ sock, jid, reply, isGroup, isGroupAdmin }) {
            if (!(await requireGroup(reply, isGroup))) return;
            if (!(await requireAdmin(reply, isGroupAdmin))) return;

            try {
                const code = await sock.groupInviteCode(jid);

                await reply(
                    `🔗 *GROUP INVITE*\n\n` +
                    `https://chat.whatsapp.com/${code}`
                );
            } catch {
                await reply('❌ Unable to get group invite link.');
            }
        }
    },

    {
        name: 'revoke',
        description: 'Revoke group invite link',
        category: 'GROUP',

        async execute({ sock, jid, reply, isGroup, isGroupAdmin }) {
            if (!(await requireGroup(reply, isGroup))) return;
            if (!(await requireAdmin(reply, isGroupAdmin))) return;

            try {
                await sock.groupRevokeInvite(jid);
                await reply('✅ Group invite link revoked.');
            } catch {
                await reply('❌ Failed to revoke invite.');
            }
        }
    }
];