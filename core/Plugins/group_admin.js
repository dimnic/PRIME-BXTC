
'use strict';

/*
 * PRIME BOT
 * GROUP ADMIN COMMANDS
 *
 * Commands:
 * /kick
 * /add
 * /promote
 * /demote
 * /mute
 * /unmute
 *
 * Mute format:
 * GROUP_JID:USER_JID
 *
 * This matches the mute system in sock.js.
 */


/* ==========================================================================
   JID HELPERS
   ========================================================================== */

function normalizeJid(jid) {
    if (!jid) {
        return '';
    }

    return String(jid)
        .trim()
        .replace(/:\d+@/, '@');
}


function normalizeNumber(number) {
    if (!number) {
        return '';
    }

    let value = String(number)
        .replace(/\D/g, '');

    /*
     * Nigeria:
     * 08012345678 -> 2348012345678
     */
    if (
        value.startsWith('0') &&
        value.length > 1
    ) {
        value =
            '234' + value.slice(1);
    }

    return value;
}


function numberToJid(number) {
    const clean =
        normalizeNumber(number);

    if (!clean) {
        return '';
    }

    return `${clean}@s.whatsapp.net`;
}


/* ==========================================================================
   TARGET FINDER
   ========================================================================== */

/*
 * Gets all possible identities from a message.
 *
 * WhatsApp can provide different IDs depending on the message:
 *
 * participantPn
 * senderPn
 * participant
 * senderLid
 * remoteJid
 * remoteJidAlt
 */

function getMessageIdentities(message) {

    const key =
        message?.key || {};

    const identities = [];

    const candidates = [
        key.participantPn,
        key.senderPn,
        key.participant,
        key.participantAlt,
        key.senderLid,
        key.remoteJidAlt
    ];

    for (const candidate of candidates) {

        if (!candidate) {
            continue;
        }

        const jid =
            normalizeJid(candidate);

        if (
            jid.endsWith('@s.whatsapp.net') ||
            jid.endsWith('@lid')
        ) {
            if (!identities.includes(jid)) {
                identities.push(jid);
            }
        }
    }

    return identities;
}


/*
 * Get target from:
 *
 * 1. Mention
 * 2. Reply
 * 3. Phone number
 */

function getTargetJid(message, args = []) {

    /*
     * ------------------------------------------------------------
     * MENTION
     * ------------------------------------------------------------
     */

    const mentioned =
        message
            ?.message
            ?.extendedTextMessage
            ?.contextInfo
            ?.mentionedJid;

    if (
        Array.isArray(mentioned) &&
        mentioned.length
    ) {
        return normalizeJid(
            mentioned[0]
        );
    }


    /*
     * ------------------------------------------------------------
     * REPLIED MESSAGE
     * ------------------------------------------------------------
     */

    const contextInfo =
        message
            ?.message
            ?.extendedTextMessage
            ?.contextInfo;

    if (contextInfo) {

        const quotedTarget =
            contextInfo.participantPn ||
            contextInfo.senderPn ||
            contextInfo.participant ||
            contextInfo.participantAlt;

        if (quotedTarget) {
            return normalizeJid(
                quotedTarget
            );
        }
    }


    /*
     * ------------------------------------------------------------
     * PHONE NUMBER
     * ------------------------------------------------------------
     */

    const number =
        normalizeNumber(
            String(args[0] || '')
        );

    if (
        number &&
        number.length >= 7
    ) {
        return numberToJid(number);
    }


    return null;
}


/*
 * Get multiple targets.
 *
 * If multiple users are mentioned,
 * all of them are returned.
 */

function getTargets(message, args = []) {

    const mentioned =
        message
            ?.message
            ?.extendedTextMessage
            ?.contextInfo
            ?.mentionedJid;

    if (
        Array.isArray(mentioned) &&
        mentioned.length
    ) {
        return [
            ...new Set(
                mentioned
                    .map(normalizeJid)
                    .filter(Boolean)
            )
        ];
    }


    const target =
        getTargetJid(
            message,
            args
        );

    return target
        ? [target]
        : [];
}


/* ==========================================================================
   GROUP CHECKS
   ========================================================================== */

function requireGroup(isGroup) {
    return Boolean(isGroup);
}


function requireAdmin(isGroupAdmin) {
    return Boolean(isGroupAdmin);
}


function requireBotAdmin(isBotAdmin) {
    return Boolean(isBotAdmin);
}


/* ==========================================================================
   MUTE KEY
   ========================================================================== */

/*
 * IMPORTANT:
 *
 * This MUST match sock.js:
 *
 * GROUP_JID:USER_JID
 */

function getMuteKey(groupJid, userJid) {

    const group =
        normalizeJid(groupJid);

    const user =
        normalizeJid(userJid);

    if (!group || !user) {
        return '';
    }

    return `${group}:${user}`;
}


/* ==========================================================================
   EXPORT COMMANDS
   ========================================================================== */

module.exports = [

    /* ======================================================================
       KICK
       ====================================================================== */

    {
        name: 'kick',

        alias: ['remove'],

        aliases: ['remove'],

        description:
            'Remove a member from the group',

        category:
            'GROUP ADMIN',

        async execute({
            sock,
            jid,
            message,
            args,
            reply,
            isGroup,
            isGroupAdmin,
            isBotAdmin
        }) {

            if (
                !requireGroup(isGroup)
            ) {
                return reply(
                    '❌ This command only works in groups.'
                );
            }


            if (
                !requireAdmin(isGroupAdmin)
            ) {
                return reply(
                    '❌ Only group admins can use /kick.'
                );
            }


            if (
                !requireBotAdmin(isBotAdmin)
            ) {
                return reply(
                    '❌ I need to be a group admin first.'
                );
            }


            const targets =
                getTargets(
                    message,
                    args
                );


            if (!targets.length) {
                return reply(
                    '❌ Mention, reply to, or provide the number of the member to remove.'
                );
            }


            try {

                await sock.groupParticipantsUpdate(
                    jid,
                    targets,
                    'remove'
                );

                await reply(
                    `✅ Removed ${targets.length} member${targets.length > 1 ? 's' : ''}.`
                );

            } catch (error) {

                console.error(
                    '❌ Kick failed:',
                    error
                );

                await reply(
                    `❌ Failed to remove member${targets.length > 1 ? 's' : ''}.\n\n${error.message || error}`
                );
            }
        }
    },


    /* ======================================================================
       ADD
       ====================================================================== */

    {
        name: 'add',

        alias: ['invite'],

        aliases: ['invite'],

        description:
            'Add a member to the group',

        category:
            'GROUP ADMIN',

        async execute({
            sock,
            jid,
            args,
            reply,
            isGroup,
            isGroupAdmin,
            isBotAdmin
        }) {

            if (
                !requireGroup(isGroup)
            ) {
                return reply(
                    '❌ This command only works in groups.'
                );
            }


            if (
                !requireAdmin(isGroupAdmin)
            ) {
                return reply(
                    '❌ Only group admins can use /add.'
                );
            }


            if (
                !requireBotAdmin(isBotAdmin)
            ) {
                return reply(
                    '❌ I need to be a group admin first.'
                );
            }


            const number =
                normalizeNumber(
                    String(args[0] || '')
                );


            if (
                !number ||
                number.length < 7
            ) {
                return reply(
                    '❌ Usage:\n/add 2348012345678'
                );
            }


            const target =
                numberToJid(number);


            try {

                await sock.groupParticipantsUpdate(
                    jid,
                    [target],
                    'add'
                );

                await reply(
                    `✅ Add request sent for @${number}.`,
                    {
                        mentions: [target]
                    }
                );

            } catch (error) {

                console.error(
                    '❌ Add failed:',
                    error
                );

                await reply(
                    `❌ Failed to add @${number}.\n\n${error.message || error}`,
                    {
                        mentions: [target]
                    }
                );
            }
        }
    },


    /* ======================================================================
       PROMOTE
       ====================================================================== */

    {
        name: 'promote',

        alias: ['admin'],

        aliases: ['admin'],

        description:
            'Promote a member to admin',

        category:
            'GROUP ADMIN',

        async execute({
            sock,
            jid,
            message,
            args,
            reply,
            isGroup,
            isGroupAdmin,
            isBotAdmin
        }) {

            if (
                !requireGroup(isGroup)
            ) {
                return reply(
                    '❌ This command only works in groups.'
                );
            }


            if (
                !requireAdmin(isGroupAdmin)
            ) {
                return reply(
                    '❌ Only group admins can use /promote.'
                );
            }


            if (
                !requireBotAdmin(isBotAdmin)
            ) {
                return reply(
                    '❌ I need to be a group admin first.'
                );
            }


            const targets =
                getTargets(
                    message,
                    args
                );


            if (!targets.length) {
                return reply(
                    '❌ Mention or reply to the member.'
                );
            }


            try {

                await sock.groupParticipantsUpdate(
                    jid,
                    targets,
                    'promote'
                );

                await reply(
                    `👑 Promoted ${targets.length} member${targets.length > 1 ? 's' : ''} successfully.`
                );

            } catch (error) {

                console.error(
                    '❌ Promote failed:',
                    error
                );

                await reply(
                    `❌ Failed to promote member${targets.length > 1 ? 's' : ''}.\n\n${error.message || error}`
                );
            }
        }
    },


    /* ======================================================================
       DEMOTE
       ====================================================================== */

    {
        name: 'demote',

        alias: ['unadmin'],

        aliases: ['unadmin'],

        description:
            'Remove admin status',

        category:
            'GROUP ADMIN',

        async execute({
            sock,
            jid,
            message,
            args,
            reply,
            isGroup,
            isGroupAdmin,
            isBotAdmin
        }) {

            if (
                !requireGroup(isGroup)
            ) {
                return reply(
                    '❌ This command only works in groups.'
                );
            }


            if (
                !requireAdmin(isGroupAdmin)
            ) {
                return reply(
                    '❌ Only group admins can use /demote.'
                );
            }


            if (
                !requireBotAdmin(isBotAdmin)
            ) {
                return reply(
                    '❌ I need to be a group admin first.'
                );
            }


            const targets =
                getTargets(
                    message,
                    args
                );


            if (!targets.length) {
                return reply(
                    '❌ Mention or reply to the admin.'
                );
            }


            try {

                await sock.groupParticipantsUpdate(
                    jid,
                    targets,
                    'demote'
                );

                await reply(
                    `✅ Removed admin privileges from ${targets.length} member${targets.length > 1 ? 's' : ''}.`
                );

            } catch (error) {

                console.error(
                    '❌ Demote failed:',
                    error
                );

                await reply(
                    `❌ Failed to demote member${targets.length > 1 ? 's' : ''}.\n\n${error.message || error}`
                );
            }
        }
    },


    /* ======================================================================
       MUTE
       ====================================================================== */

    {
        name: 'mute',

        alias: ['silence'],

        aliases: ['silence'],

        description:
            'Mute a group member',

        category:
            'GROUP ADMIN',

        async execute({
            jid,
            message,
            args,
            reply,
            isGroup,
            isGroupAdmin,
            isBotAdmin
        }) {

            if (
                !requireGroup(isGroup)
            ) {
                return reply(
                    '❌ This command only works in groups.'
                );
            }


            if (
                !requireAdmin(isGroupAdmin)
            ) {
                return reply(
                    '❌ Only group admins can use /mute.'
                );
            }


            if (
                !requireBotAdmin(isBotAdmin)
            ) {
                return reply(
                    '❌ I need to be a group admin first.'
                );
            }


            const targets =
                getTargets(
                    message,
                    args
                );


            if (!targets.length) {
                return reply(
                    '❌ Mention or reply to the member.'
                );
            }


            if (
                !(global.mutedUsers instanceof Set)
            ) {
                global.mutedUsers =
                    new Set();
            }


            let addedCount = 0;
            let alreadyMuted = 0;


            for (
                const target
                of targets
            ) {

                const normalizedTarget =
                    normalizeJid(target);

                const muteKey =
                    getMuteKey(
                        jid,
                        normalizedTarget
                    );


                if (!muteKey) {
                    continue;
                }


                if (
                    global.mutedUsers.has(
                        muteKey
                    )
                ) {
                    alreadyMuted++;
                    continue;
                }


                global.mutedUsers.add(
                    muteKey
                );

                addedCount++;


                console.log(
                    `🔇 Muted: ${muteKey}`
                );
            }


            if (
                addedCount === 0
            ) {
                return reply(
                    '⚠️ Selected user(s) are already muted in this group.'
                );
            }


            let response =
                `🔇 Muted ${addedCount} member${addedCount > 1 ? 's' : ''}.`;

            if (alreadyMuted > 0) {
                response +=
                    `\n⚠️ ${alreadyMuted} member${alreadyMuted > 1 ? 's were' : ' was'} already muted.`;
            }

            response +=
                '\n\nTheir messages and commands will be ignored by Prime Bot in this group.';


            await reply(response);
        }
    },


    /* ======================================================================
       UNMUTE
       ====================================================================== */

    {
        name: 'unmute',

        alias: ['unsilence'],

        aliases: ['unsilence'],

        description:
            'Unmute a member',

        category:
            'GROUP ADMIN',

        async execute({
            jid,
            message,
            args,
            reply,
            isGroup,
            isGroupAdmin,
            isBotAdmin
        }) {

            if (
                !requireGroup(isGroup)
            ) {
                return reply(
                    '❌ This command only works in groups.'
                );
            }


            if (
                !requireAdmin(isGroupAdmin)
            ) {
                return reply(
                    '❌ Only group admins can use /unmute.'
                );
            }


            if (
                !requireBotAdmin(isBotAdmin)
            ) {
                return reply(
                    '❌ I need to be a group admin first.'
                );
            }


            const targets =
                getTargets(
                    message,
                    args
                );


            if (!targets.length) {
                return reply(
                    '❌ Mention or reply to the member.'
                );
            }


            if (
                !(global.mutedUsers instanceof Set)
            ) {
                global.mutedUsers =
                    new Set();
            }


            let unmutedCount = 0;
            let notMutedCount = 0;


            for (
                const target
                of targets
            ) {

                const normalizedTarget =
                    normalizeJid(target);

                const muteKey =
                    getMuteKey(
                        jid,
                        normalizedTarget
                    );


                if (
                    global.mutedUsers.has(
                        muteKey
                    )
                ) {

                    global.mutedUsers.delete(
                        muteKey
                    );

                    unmutedCount++;


                    console.log(
                        `🔊 Unmuted: ${muteKey}`
                    );

                } else {

                    notMutedCount++;
                }
            }


            if (
                unmutedCount === 0
            ) {
                return reply(
                    '⚠️ Selected user(s) were not muted in this group.'
                );
            }


            let response =
                `🔊 Unmuted ${unmutedCount} member${unmutedCount > 1 ? 's' : ''}.`;

            if (notMutedCount > 0) {
                response +=
                    `\n⚠️ ${notMutedCount} member${notMutedCount > 1 ? 's were' : ' was'} not muted.`;
            }

            response +=
                '\n\nThey can now interact with Prime Bot again.';


            await reply(response);
        }
    }

];

