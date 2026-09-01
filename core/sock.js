'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const cfg = require('../config');

const BOT_NAME = cfg.BOT_NAME || 'PRIME BOT';
const VERSION = cfg.VERSION || '2.1.0';
const PREFIX = cfg.PREFIX || '/';

/* ==========================================================================
   GLOBAL STATE
========================================================================== */

global.plugins = global.plugins || new Map();

global.OWNER_NUMBERS = [];
global.SUDO = [];

global.isPublic =
    typeof global.isPublic === 'boolean'
        ? global.isPublic
        : true;

global.BOT_NUMBER = '';
global.BOT_LID = '';

global.mutedUsers =
    global.mutedUsers || new Set();

global.bannedUsers =
    global.bannedUsers || new Set();

global.antilink =
    global.antilink || new Set();

global.antispam =
    global.antispam || new Set();

global.antitag =
    global.antitag || new Set();

global.antibot =
    global.antibot || new Set();

global.welcome =
    global.welcome || {};

global.goodbye =
    global.goodbye || {};

global.welcomeMsg =
    global.welcomeMsg || {};

global.goodbyeMsg =
    global.goodbyeMsg || {};

global.aiMemory =
    global.aiMemory || {};

global.maxWarns =
    global.maxWarns || 3;

global.warns =
    global.warns || {};

/* ==========================================================================
   DIRECTORIES
========================================================================== */

const ROOT_DIR = path.join(__dirname, '..');

const AUTH_DIR =
    path.join(__dirname, 'auth_info');

const ROOT_PLUGIN_DIR =
    path.join(ROOT_DIR, 'plugins');

const LEGACY_PLUGIN_DIR =
    path.join(__dirname, 'Plugins');

const COMMANDS_DIR =
    path.join(ROOT_DIR, 'commands');

const PLUGIN_DIR =
    fs.existsSync(ROOT_PLUGIN_DIR)
        ? ROOT_PLUGIN_DIR
        : LEGACY_PLUGIN_DIR;

const QR_FILE =
    path.join(ROOT_DIR, 'qr.png');

if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, {
        recursive: true
    });
}

if (!fs.existsSync(PLUGIN_DIR)) {
    fs.mkdirSync(PLUGIN_DIR, {
        recursive: true
    });
}

/* ==========================================================================
   NUMBER / JID HELPERS
========================================================================== */

function normalizeNumber(number) {
    if (!number) {
        return '';
    }

    let value =
        String(number).replace(/\D/g, '');

    if (
        value.startsWith('0') &&
        value.length > 1
    ) {
        value =
            '234' + value.slice(1);
    }

    return value;
}

function normalizeJid(jid) {
    if (!jid) {
        return '';
    }

    return String(jid)
        .trim()
        .replace(/:\d+@/, '@');
}

function jidNumber(jid) {
    if (!jid) {
        return '';
    }

    return String(jid)
        .split('@')[0]
        .split(':')[0]
        .replace(/\D/g, '');
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
   MUTE HELPERS
========================================================================== */

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

/*
 * IMPORTANT:
 * This checks:
 *
 * 1. Exact group:user key
 * 2. Phone JID
 * 3. LID
 * 4. Alternative WhatsApp identities
 * 5. Older mute entries
 */
function isUserMuted(groupJid, userJid) {
    if (
        !groupJid ||
        !userJid ||
        !(global.mutedUsers instanceof Set)
    ) {
        return false;
    }

    const group =
        normalizeJid(groupJid);

    const user =
        normalizeJid(userJid);

    if (!group || !user) {
        return false;
    }

    const exactKey =
        getMuteKey(group, user);

    /*
     * First check exact key.
     */
    if (
        exactKey &&
        global.mutedUsers.has(exactKey)
    ) {
        return true;
    }

    /*
     * Then check every stored mute entry.
     */
    for (const stored of global.mutedUsers) {
        const value =
            String(stored || '').trim();

        if (!value) {
            continue;
        }

        /*
         * Normal format:
         *
         * groupJid:userJid
         */
        if (value.includes(':')) {
            const separator =
                value.indexOf(':');

            const storedGroup =
                normalizeJid(
                    value.slice(
                        0,
                        separator
                    )
                );

            const storedUser =
                normalizeJid(
                    value.slice(
                        separator + 1
                    )
                );

            if (
                storedGroup === group &&
                identityMatches(
                    storedUser,
                    user
                )
            ) {
                return true;
            }

            continue;
        }

        /*
         * Backwards compatibility:
         * if an old mute entry contains
         * only the user's JID.
         */
        if (
            identityMatches(
                value,
                user
            )
        ) {
            return true;
        }
    }

    return false;
}

/* ==========================================================================
   CONFIGURATION
========================================================================== */

function getConfiguredBotNumber() {
    try {
        if (
            cfg &&
            typeof cfg.getPhoneNumber ===
                'function'
        ) {
            return normalizeNumber(
                cfg.getPhoneNumber()
            );
        }
    } catch (_) {}

    return normalizeNumber(
        cfg?.BOT_NUMBER ||
        process.env.BOT_NUMBER ||
        process.env.PHONE_NUMBER ||
        ''
    );
}

function getConfiguredOwners() {
    let owners = [];

    try {
        if (
            cfg &&
            Array.isArray(
                cfg.OWNER_NUMBERS
            )
        ) {
            owners =
                cfg.OWNER_NUMBERS;
        }

        if (
            owners.length === 0 &&
            cfg &&
            typeof cfg.getOwners ===
                'function'
        ) {
            owners =
                cfg.getOwners();
        }
    } catch (error) {
        console.error(
            '❌ Failed to read OWNER_NUMBERS:',
            error.message
        );
    }

    if (!Array.isArray(owners)) {
        owners =
            owners
                ? [owners]
                : [];
    }

    return owners
        .map(value => {
            const str =
                String(
                    value || ''
                ).trim();

            if (!str) {
                return '';
            }

            if (
                str.endsWith(
                    '@s.whatsapp.net'
                ) ||
                str.endsWith('@lid')
            ) {
                return normalizeJid(str);
            }

            return numberToJid(str);
        })
        .filter(Boolean);
}

function getConfiguredSudo() {
    let sudo = [];

    try {
        if (
            cfg &&
            Array.isArray(
                cfg.SUDO_NUMBERS
            )
        ) {
            sudo =
                cfg.SUDO_NUMBERS;
        }

        if (
            sudo.length === 0 &&
            cfg &&
            typeof cfg.getSudo ===
                'function'
        ) {
            sudo =
                cfg.getSudo();
        }
    } catch (error) {
        console.error(
            '❌ Failed to read SUDO_NUMBERS:',
            error.message
        );
    }

    if (!Array.isArray(sudo)) {
        sudo =
            sudo
                ? [sudo]
                : [];
    }

    return sudo
        .map(value => {
            const str =
                String(
                    value || ''
                ).trim();

            if (!str) {
                return '';
            }

            if (
                str.endsWith(
                    '@s.whatsapp.net'
                ) ||
                str.endsWith('@lid')
            ) {
                return normalizeJid(str);
            }

            return numberToJid(str);
        })
        .filter(Boolean);
}

/* ==========================================================================
   ACCESS LISTS
========================================================================== */

function initializeAccessLists() {
    const owners =
        getConfiguredOwners();

    const sudo =
        getConfiguredSudo();

    global.OWNER_NUMBERS = [
        ...new Set(owners)
    ];

    global.SUDO = [
        ...new Set(sudo)
    ];

    console.log(
        `👑 Loaded owners: ${
            global.OWNER_NUMBERS.join(', ') ||
            'NONE'
        }`
    );

    console.log(
        `🛡️ Loaded sudo: ${
            global.SUDO.join(', ') ||
            'NONE'
        }`
    );
}

initializeAccessLists();

/* ==========================================================================
   IDENTITY HELPERS
========================================================================== */

function extractNumberFromIdentity(
    identity
) {
    if (!identity) {
        return '';
    }

    const normalized =
        normalizeJid(identity);

    if (
        !normalized.endsWith(
            '@s.whatsapp.net'
        )
    ) {
        return '';
    }

    return normalizeNumber(
        normalized.split('@')[0]
    );
}

function identityMatches(
    identity,
    configured
) {
    if (
        !identity ||
        !configured
    ) {
        return false;
    }

    const a =
        normalizeJid(identity);

    const b =
        normalizeJid(configured);

    if (!a || !b) {
        return false;
    }

    if (a === b) {
        return true;
    }

    const aNumber =
        extractNumberFromIdentity(a);

    const bNumber =
        extractNumberFromIdentity(b);

    return Boolean(
        aNumber &&
        bNumber &&
        aNumber === bNumber
    );
}

/* ==========================================================================
   MESSAGE IDENTITIES
========================================================================== */

function getAllUserIds(message) {
    const ids =
        new Set();

    const key =
        message?.key || {};

    const candidates = [
        key.participantPn,
        key.senderPn,
        key.participant,
        key.participantAlt,
        key.senderLid,
        key.remoteJid,
        key.remoteJidAlt
    ];

    for (
        const candidate of candidates
    ) {
        if (!candidate) {
            continue;
        }

        const normalized =
            normalizeJid(candidate);

        if (
            normalized.endsWith(
                '@s.whatsapp.net'
            ) ||
            normalized.endsWith('@lid') ||
            normalized.endsWith('@g.us')
        ) {
            ids.add(normalized);
        }
    }

    if (key.fromMe) {
        if (global.BOT_NUMBER) {
            ids.add(
                normalizeJid(
                    global.BOT_NUMBER
                )
            );
        }

        if (global.BOT_LID) {
            ids.add(
                normalizeJid(
                    global.BOT_LID
                )
            );
        }

        const configuredBot =
            getConfiguredBotNumber();

        if (configuredBot) {
            ids.add(
                numberToJid(
                    configuredBot
                )
            );
        }
    }

    return [...ids];
}

/* ==========================================================================
   OWNER / SUDO
========================================================================== */

function isOwnerIdentity(ids) {
    const identities =
        Array.isArray(ids)
            ? ids
            : [ids];

    return identities.some(
        identity =>
            global.OWNER_NUMBERS.some(
                owner =>
                    identityMatches(
                        identity,
                        owner
                    )
            )
    );
}

function isSudoIdentity(ids) {
    const identities =
        Array.isArray(ids)
            ? ids
            : [ids];

    return identities.some(
        identity =>
            global.SUDO.some(
                sudo =>
                    identityMatches(
                        identity,
                        sudo
                    )
            )
    );
}

/* ==========================================================================
   MESSAGE TEXT
========================================================================== */

function getTextFromMessage(message) {
    const msg =
        message?.message;

    if (!msg) {
        return '';
    }

    return (
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        msg.documentMessage?.caption ||
        msg.buttonsResponseMessage
            ?.selectedButtonId ||
        msg.listResponseMessage
            ?.singleSelectReply
            ?.selectedRowId ||
        msg.templateButtonReplyMessage
            ?.selectedId ||
        ''
    );
}

/* ==========================================================================
   MENTIONS
========================================================================== */

function getMentions(message) {
    return (
        message?.message
            ?.extendedTextMessage
            ?.contextInfo
            ?.mentionedJid || []
    );
}

/* ==========================================================================
   QUOTED MESSAGE
========================================================================== */

function getQuotedMessage(message) {
    return (
        message?.message
            ?.extendedTextMessage
            ?.contextInfo
            ?.quotedMessage || null
    );
}

/* ==========================================================================
   MEDIA
========================================================================== */

function getMediaType(message) {
    if (!message) {
        return null;
    }

    const msg =
        message.message ||
        message;

    if (msg.imageMessage) {
        return 'image';
    }

    if (msg.videoMessage) {
        return 'video';
    }

    if (msg.audioMessage) {
        return 'audio';
    }

    if (msg.documentMessage) {
        return 'document';
    }

    if (msg.stickerMessage) {
        return 'sticker';
    }

    return null;
}

function getMediaMessage(message) {
    if (!message) {
        return null;
    }

    const msg =
        message.message ||
        message;

    if (msg.imageMessage) {
        return msg.imageMessage;
    }

    if (msg.videoMessage) {
        return msg.videoMessage;
    }

    if (msg.audioMessage) {
        return msg.audioMessage;
    }

    if (msg.documentMessage) {
        return msg.documentMessage;
    }

    if (msg.stickerMessage) {
        return msg.stickerMessage;
    }

    return null;
}

async function downloadMedia(message) {
    try {
        const mediaType =
            getMediaType(message);

        const mediaMessage =
            getMediaMessage(message);

        if (
            !mediaType ||
            !mediaMessage
        ) {
            return null;
        }

        if (
            !mediaMessage.url &&
            !mediaMessage.directPath
        ) {
            console.error(
                '❌ Media has no url/directPath.'
            );

            return null;
        }

        const stream =
            await downloadContentFromMessage(
                mediaMessage,
                mediaType
            );

        const chunks = [];

        for await (
            const chunk of stream
        ) {
            chunks.push(
                Buffer.from(chunk)
            );
        }

        return Buffer.concat(chunks);
    } catch (error) {
        console.error(
            '❌ Media download failed:',
            error.message
        );

        return null;
    }
}

async function downloadQuotedMedia(
    message
) {
    try {
        const quoted =
            getQuotedMessage(message);

        if (!quoted) {
            return null;
        }

        return await downloadMedia(
            quoted
        );
    } catch (error) {
        console.error(
            '❌ Quoted media download failed:',
            error.message
        );

        return null;
    }
}

async function downloadAnyMedia(
    message
) {
    try {
        const directType =
            getMediaType(message);

        if (directType) {
            const buffer =
                await downloadMedia(
                    message
                );

            if (buffer) {
                return {
                    buffer,
                    type: directType,
                    quoted: false,
                    message
                };
            }
        }

        const quoted =
            getQuotedMessage(message);

        if (quoted) {
            const quotedType =
                getMediaType(quoted);

            if (quotedType) {
                const buffer =
                    await downloadMedia(
                        quoted
                    );

                if (buffer) {
                    return {
                        buffer,
                        type: quotedType,
                        quoted: true,
                        message: quoted
                    };
                }
            }
        }

        return null;
    } catch (error) {
        console.error(
            '❌ downloadAnyMedia error:',
            error.message
        );

        return null;
    }
}

/* ==========================================================================
   SENDER
========================================================================== */

function getSender(message) {
    const ids =
        getAllUserIds(message);

    const phoneId =
        ids.find(
            id =>
                id.endsWith(
                    '@s.whatsapp.net'
                )
        );

    if (phoneId) {
        return phoneId;
    }

    return (
        ids[0] ||
        message?.key?.participant ||
        message?.key?.remoteJid ||
        ''
    );
}

/* ==========================================================================
   GROUP FUNCTIONS
========================================================================== */

async function getGroupMetadata(
    sock,
    jid
) {
    if (
        !jid ||
        !jid.endsWith('@g.us')
    ) {
        return null;
    }

    try {
        return await sock.groupMetadata(
            jid
        );
    } catch (error) {
        console.error(
            '❌ Group metadata error:',
            error.message
        );

        return null;
    }
}

async function isGroupAdmin(
    sock,
    jid,
    identities
) {
    if (
        !jid ||
        !jid.endsWith('@g.us')
    ) {
        return false;
    }

    const metadata =
        await getGroupMetadata(
            sock,
            jid
        );

    if (!metadata) {
        return false;
    }

    const ids =
        Array.isArray(identities)
            ? identities
            : [identities];

    return metadata.participants.some(
        participant => {
            const participantId =
                normalizeJid(
                    participant.id
                );

            const matched =
                ids.some(
                    id =>
                        identityMatches(
                            participantId,
                            id
                        )
                );

            return (
                matched &&
                (
                    participant.admin ===
                        'admin' ||
                    participant.admin ===
                        'superadmin'
                )
            );
        }
    );
}

async function isBotAdmin(
    sock,
    jid
) {
    return isGroupAdmin(
        sock,
        jid,
        [
            global.BOT_NUMBER,
            global.BOT_LID,
            numberToJid(
                getConfiguredBotNumber()
            )
        ].filter(Boolean)
    );
}

/* ==========================================================================
   SENDING
========================================================================== */

function resolveReplyJid(
    message,
    sock
) {
    const key =
        message?.key || {};

    const remote =
        normalizeJid(
            key.remoteJid || ''
        );

    const alternate =
        normalizeJid(
            key.remoteJidAlt || ''
        );

    const botNumber =
        normalizeJid(
            global.BOT_NUMBER ||
            sock?.user?.id ||
            ''
        );

    const botLid =
        normalizeJid(
            global.BOT_LID ||
            sock?.user?.lid ||
            ''
        );

    if (
        key.fromMe === true &&
        botNumber &&
        remote === botLid
    ) {
        return botNumber;
    }

    if (
        key.fromMe === true &&
        botNumber &&
        remote &&
        jidNumber(remote) ===
            jidNumber(botNumber)
    ) {
        return botNumber;
    }

    if (
        alternate.endsWith(
            '@s.whatsapp.net'
        )
    ) {
        return alternate;
    }

    return remote || alternate;
}

async function sendText(
    sock,
    jid,
    text,
    options = {}
) {
    if (!sock) {
        throw new Error(
            'WhatsApp socket unavailable.'
        );
    }

    if (!jid) {
        return null;
    }

    if (!sock.user) {
        throw new Error(
            'WhatsApp connection is not open.'
        );
    }

    return sock.sendMessage(
        normalizeJid(jid),
        {
            text: String(text ?? '')
        },
        options
    );
}

async function replyTo(
    sock,
    message,
    text,
    options = {}
) {
    const jid =
        resolveReplyJid(
            message,
            sock
        );

    if (!jid) {
        console.error(
            '❌ Could not determine reply destination.'
        );

        return null;
    }

    return sendText(
        sock,
        jid,
        text,
        {
            quoted: message,
            ...options
        }
    );
}

/* ==========================================================================
   COMMAND PARSER
========================================================================== */

function parseCommand(text) {
    if (!text) {
        return null;
    }

    const trimmed =
        String(text).trim();

    let activePrefix = '';

    if (
        trimmed.startsWith(PREFIX)
    ) {
        activePrefix = PREFIX;
    } else if (
        PREFIX !== '.' &&
        trimmed.startsWith('.')
    ) {
        activePrefix = '.';
    } else {
        return null;
    }

    const withoutPrefix =
        trimmed
            .slice(activePrefix.length)
            .trim();

    if (!withoutPrefix) {
        return null;
    }

    const parts =
        withoutPrefix.split(/\s+/);

    const command =
        String(
            parts.shift() || ''
        )
            .toLowerCase()
            .trim();

    if (!command) {
        return null;
    }

    return {
        command,
        args: parts,
        text: parts.join(' '),
        raw: trimmed,
        prefix: activePrefix
    };
}

/* ==========================================================================
   PLUGIN LOADER
========================================================================== */

async function loadPlugins() {
    global.plugins.clear();

    console.log('');
    console.log(
        '========================================'
    );
    console.log(
        '          📂 LOADING PLUGINS'
    );
    console.log(
        '========================================'
    );

    if (!fs.existsSync(PLUGIN_DIR)) {
        fs.mkdirSync(
            PLUGIN_DIR,
            {
                recursive: true
            }
        );
    }

    function collectJavaScriptFiles(
        directory
    ) {
        if (!fs.existsSync(directory)) {
            return [];
        }

        const result = [];

        function walk(current) {
            for (
                const entry of fs.readdirSync(
                    current,
                    {
                        withFileTypes: true
                    }
                )
            ) {
                const full =
                    path.join(
                        current,
                        entry.name
                    );

                if (entry.isDirectory()) {
                    walk(full);
                } else if (
                    entry.isFile() &&
                    entry.name
                        .toLowerCase()
                        .endsWith('.js')
                ) {
                    result.push(full);
                }
            }
        }

        walk(directory);

        return result;
    }

    const pluginDirectories = [
        ROOT_PLUGIN_DIR,
        LEGACY_PLUGIN_DIR
    ].filter(
        (
            directory,
            index,
            array
        ) =>
            fs.existsSync(directory) &&
            array.indexOf(directory) ===
                index
    );

    const files = [
        ...pluginDirectories
            .sort((a, b) => a.localeCompare(b))
            .flatMap(
                directory =>
                    collectJavaScriptFiles(
                        directory
                    )
            ),
        ...collectJavaScriptFiles(
            COMMANDS_DIR
        )
    ];

    let loadedFiles = 0;

    const seenCommands =
        new Set();

    for (
        const fullPath of files
    ) {
        const file =
            path.relative(
                ROOT_DIR,
                fullPath
            );

        try {
            delete require.cache[
                require.resolve(fullPath)
            ];

            const imported =
                require(fullPath);

            const commands =
                Array.isArray(imported)
                    ? imported
                    : [imported];

            let fileLoaded = false;

            for (
                const command of commands
            ) {
                if (
                    !command ||
                    typeof command !==
                        'object'
                ) {
                    continue;
                }

                const commandName =
                    command.name ||
                    command.command;

                if (!commandName) {
                    continue;
                }

                const execute =
                    command.execute ||
                    command.handler;

                if (
                    typeof execute !==
                    'function'
                ) {
                    console.log(
                        `⚠️ ${file}: /${commandName} has no execute function`
                    );

                    continue;
                }

                command.name =
                    String(commandName)
                        .toLowerCase()
                        .trim();

                command.execute =
                    execute;

                if (
                    seenCommands.has(
                        command.name
                    )
                ) {
                    console.log(
                        `⚠️ Duplicate command ignored: /${command.name}`
                    );

                    continue;
                }

                seenCommands.add(
                    command.name
                );

                global.plugins.set(
                    command.name,
                    command
                );

                fileLoaded = true;

                const aliases =
                    Array.isArray(
                        command.alias
                    )
                        ? command.alias
                        : Array.isArray(
                            command.aliases
                        )
                            ? command.aliases
                            : [];

                for (
                    const alias of aliases
                ) {
                    if (!alias) {
                        continue;
                    }

                    global.plugins.set(
                        String(alias)
                            .toLowerCase()
                            .trim(),
                        command
                    );
                }

                console.log(
                    `✅ /${command.name}`
                );
            }

            if (fileLoaded) {
                loadedFiles++;
            }
        } catch (error) {
            console.error(
                `❌ ${file}:`,
                error.message
            );
        }
    }

    console.log('');

    console.log(
        `📦 Plugin files loaded: ${loadedFiles}/${files.length}`
    );

    console.log(
        `🧩 Commands available: ${global.plugins.size}`
    );

    console.log('');
}

/* ==========================================================================
   PLUGIN EXECUTION
========================================================================== */

async function executePlugin(
    sock,
    plugin,
    message,
    parsed,
    sender,
    jid,
    isGroup,
    owner,
    sudo,
    privileged
) {
    const groupMetadata =
        isGroup
            ? await getGroupMetadata(
                sock,
                jid
            )
            : null;

    const groupAdmin =
        isGroup
            ? await isGroupAdmin(
                sock,
                jid,
                getAllUserIds(message)
            )
            : false;

    const botAdmin =
        isGroup
            ? await isBotAdmin(
                sock,
                jid
            )
            : false;

    const quoted =
        getQuotedMessage(message);

    const directMediaType =
        getMediaType(message);

    const quotedMediaType =
        quoted
            ? getMediaType(quoted)
            : null;

    const context = {
        sock,

        message,

        msg: message,

        jid,

        remoteJid: jid,

        sender,

        command: parsed.command,

        args: parsed.args,

        text: parsed.text,

        raw: parsed.raw,

        isGroup,

        isOwner: owner,

        isSudo: sudo,

        isPrivileged: privileged,

        isGroupAdmin: groupAdmin,

        isBotAdmin: botAdmin,

        groupMetadata,

        prefix: PREFIX,

        botName: BOT_NAME,

        version: VERSION,

        mode:
            global.isPublic
                ? 'public'
                : 'private',

        config: cfg,

        mentions:
            getMentions(message),

        quoted,

        fromMe:
            Boolean(
                message?.key?.fromMe
            ),

        isBot:
            Boolean(
                message?.key?.fromMe
            ),

        hasMedia:
            Boolean(
                directMediaType ||
                quotedMediaType
            ),

        mediaType:
            directMediaType ||
            quotedMediaType ||
            null,

        quotedMediaType:
            quotedMediaType || null,

        directMediaType:
            directMediaType || null,

        downloadMedia:
            async target =>
                downloadMedia(
                    target || message
                ),

        downloadQuotedMedia:
            async () =>
                downloadQuotedMedia(
                    message
                ),

        downloadAnyMedia:
            async () =>
                downloadAnyMedia(
                    message
                ),

        getMediaType:
            target =>
                getMediaType(
                    target || message
                ),

        getMediaMessage:
            target =>
                getMediaMessage(
                    target || message
                ),

        getQuotedMedia:
            async () => {
                if (!quoted) {
                    return null;
                }

                const type =
                    getMediaType(
                        quoted
                    );

                if (!type) {
                    return null;
                }

                const buffer =
                    await downloadMedia(
                        quoted
                    );

                if (!buffer) {
                    return null;
                }

                return {
                    buffer,
                    type,
                    message: quoted
                };
            },

        getDirectMedia:
            async () => {
                const type =
                    getMediaType(
                        message
                    );

                if (!type) {
                    return null;
                }

                const buffer =
                    await downloadMedia(
                        message
                    );

                if (!buffer) {
                    return null;
                }

                return {
                    buffer,
                    type,
                    message
                };
            },

        mutedUsers:
            global.mutedUsers,

        bannedUsers:
            global.bannedUsers,

        antilink:
            global.antilink,

        antispam:
            global.antispam,

        antitag:
            global.antitag,

        antibot:
            global.antibot,

        welcome:
            global.welcome,

        goodbye:
            global.goodbye,

        welcomeMsg:
            global.welcomeMsg,

        goodbyeMsg:
            global.goodbyeMsg,

        warns:
            global.warns,

        reply:
            async (
                messageText,
                options = {}
            ) =>
                replyTo(
                    sock,
                    message,
                    messageText,
                    options
                ),

        sendText:
            async (
                destination,
                messageText,
                options = {}
            ) =>
                sendText(
                    sock,
                    destination,
                    messageText,
                    options
                ),

        getGroupInfo:
            async () =>
                getGroupMetadata(
                    sock,
                    jid
                ),

        isAdmin:
            async user =>
                isGroupAdmin(
                    sock,
                    jid,
                    user
                ),

        botIsAdmin:
            async () =>
                isBotAdmin(
                    sock,
                    jid
                )
    };

    try {
        await plugin.execute(
            context
        );

        return true;
    } catch (error) {
        console.error(
            `❌ Command /${parsed.command} failed:`,
            error
        );

        try {
            await replyTo(
                sock,
                message,
                `❌ Command /${parsed.command} failed.\n\n${error.message || error}`
            );
        } catch (_) {}

        return false;
    }
}

/* ==========================================================================
   BOT START
========================================================================== */

let reconnecting = false;
let currentSocket = null;

async function startBot() {
    if (
        currentSocket &&
        currentSocket.user
    ) {
        console.log(
            '⚠️ Prime Bot is already connected.'
        );

        return currentSocket;
    }

    try {
        initializeAccessLists();

        const configuredMode =
            String(
                cfg.MODE || 'public'
            ).toLowerCase();

        global.isPublic =
            configuredMode !==
            'private';

        console.log('');

        console.log(
            '========================================'
        );

        console.log(
            `        ${BOT_NAME} v${VERSION}`
        );

        console.log(
            '========================================'
        );

        console.log('');

        console.log(
            `🌐 Mode: ${
                global.isPublic
                    ? 'PUBLIC'
                    : 'PRIVATE'
            }`
        );

        console.log(
            `👑 Owners: ${
                global.OWNER_NUMBERS.join(', ') ||
                'NONE'
            }`
        );

        console.log(
            `🛡️ Sudo: ${
                global.SUDO.join(', ') ||
                'NONE'
            }`
        );

        console.log('');

        const {
            state,
            saveCreds
        } =
            await useMultiFileAuthState(
                AUTH_DIR
            );

        let version;

        try {
            const latest =
                await fetchLatestBaileysVersion();

            version =
                latest?.version;

            if (version) {
                console.log(
                    `📡 WhatsApp version: ${version.join('.')}`
                );
            }
        } catch (_) {
            console.log(
                '⚠️ Could not fetch latest WhatsApp version.'
            );
        }

        const socketOptions = {
            auth: state,

            logger: pino({
                level: 'silent'
            }),

            browser: [
                BOT_NAME,
                'Chrome',
                '120.0.0.0'
            ],

            printQRInTerminal: true,

            markOnlineOnConnect: false,

            syncFullHistory: false,

            generateHighQualityLinkPreview:
                false,

            getMessage:
                async () =>
                    undefined
        };

        if (version) {
            socketOptions.version =
                version;
        }

        console.log(
            '🔌 Creating WhatsApp connection...'
        );

        const sock =
            makeWASocket(
                socketOptions
            );

        currentSocket = sock;

        sock.ev.on(
            'creds.update',
            saveCreds
        );

        /* ================================================================
           CONNECTION
        ================================================================ */

        sock.ev.on(
            'connection.update',
            async update => {
                const {
                    connection,
                    lastDisconnect,
                    qr
                } = update;

                if (qr) {
                    console.log('');

                    console.log(
                        '========================================'
                    );

                    console.log(
                        '       📱 SCAN THIS QR CODE'
                    );

                    console.log(
                        '========================================'
                    );

                    try {
                        qrcode.generate(
                            qr,
                            {
                                small: true
                            }
                        );

                        try {
                            await QRCode.toFile(
                                QR_FILE,
                                qr,
                                {
                                    type: 'png',
                                    width: 1200,
                                    margin: 4,
                                    errorCorrectionLevel:
                                        'H'
                                }
                            );

                            console.log(
                                `🖼️ QR image saved: ${QR_FILE}`
                            );
                        } catch (
                            imageError
                        ) {
                            console.error(
                                '⚠️ Could not save qr.png:',
                                imageError.message
                            );
                        }
                    } catch (
                        error
                    ) {
                        console.error(
                            '❌ Could not render QR:',
                            error.message
                        );
                    }

                    console.log(
                        '========================================'
                    );

                    console.log(
                        '📱 WhatsApp → Linked devices → Link a device'
                    );

                    console.log('');
                }

                if (
                    connection ===
                    'connecting'
                ) {
                    console.log(
                        '🔄 Connecting to WhatsApp...'
                    );
                }

                if (
                    connection ===
                    'open'
                ) {
                    reconnecting =
                        false;

                    global.BOT_NUMBER =
                        normalizeJid(
                            sock.user?.id ||
                            ''
                        );

                    global.BOT_LID =
                        normalizeJid(
                            sock.user?.lid ||
                            ''
                        );

                    const configuredBot =
                        getConfiguredBotNumber();

                    if (
                        configuredBot &&
                        !global.BOT_NUMBER
                    ) {
                        global.BOT_NUMBER =
                            numberToJid(
                                configuredBot
                            );
                    }

                    console.log('');

                    console.log(
                        '========================================'
                    );

                    console.log(
                        '       ✅ WHATSAPP CONNECTED'
                    );

                    console.log(
                        '========================================'
                    );

                    console.log('');

                    console.log(
                        `🤖 Bot: ${BOT_NAME}`
                    );

                    console.log(
                        `📱 Bot Number: ${
                            global.BOT_NUMBER ||
                            'unknown'
                        }`
                    );

                    console.log(
                        `🆔 Bot LID: ${
                            global.BOT_LID ||
                            'unknown'
                        }`
                    );

                    console.log(
                        `👑 Owners: ${
                            global.OWNER_NUMBERS.join(', ') ||
                            'NONE'
                        }`
                    );

                    console.log(
                        `🛡️ Sudo: ${
                            global.SUDO.join(', ') ||
                            'NONE'
                        }`
                    );

                    console.log(
                        `🌐 Mode: ${
                            global.isPublic
                                ? 'PUBLIC'
                                : 'PRIVATE'
                        }`
                    );

                    initializeAccessLists();

                    await loadPlugins();

                    console.log(
                        '✅ PRIME BOT IS ONLINE.'
                    );

                    console.log('');
                }

                if (
                    connection ===
                    'close'
                ) {
                    if (
                        currentSocket ===
                        sock
                    ) {
                        currentSocket =
                            null;
                    }

                    const statusCode =
                        lastDisconnect
                            ?.error
                            ?.output
                            ?.statusCode;

                    console.error('');

                    console.error(
                        '❌ WhatsApp connection closed.'
                    );

                    console.error(
                        `Status: ${
                            statusCode ||
                            'unknown'
                        }`
                    );

                    if (
                        statusCode ===
                        DisconnectReason.loggedOut
                    ) {
                        console.error(
                            '❌ Session logged out.'
                        );

                        console.error(
                            'Delete core/auth_info and pair again.'
                        );

                        return;
                    }

                    if (!reconnecting) {
                        reconnecting =
                            true;

                        console.log(
                            '🔄 Reconnecting in 5 seconds...'
                        );

                        setTimeout(
                            () => {
                                reconnecting =
                                    false;

                                startBot()
                                    .catch(
                                        error =>
                                            console.error(
                                                'Reconnect failed:',
                                                error
                                            )
                                    );
                            },
                            5000
                        );
                    }
                }
            }
        );

        /* ================================================================
           MESSAGE HANDLER
        ================================================================ */

        sock.ev.on(
            'messages.upsert',
            async ({ messages }) => {
                if (
                    !Array.isArray(
                        messages
                    )
                ) {
                    return;
                }

                for (
                    const message of messages
                ) {
                    try {
                        if (
                            !message ||
                            !message.message
                        ) {
                            continue;
                        }

                        const jid =
                            normalizeJid(
                                message.key
                                    ?.remoteJid ||
                                ''
                            );

                        if (!jid) {
                            continue;
                        }

                        if (
                            jid ===
                            'status@broadcast'
                        ) {
                            continue;
                        }

                        const fromMe =
                            Boolean(
                                message.key
                                    ?.fromMe
                            );

                        /* ==================================================
                           IDENTITIES
                        ================================================== */

                        const allIds =
                            getAllUserIds(
                                message
                            );

                        const sender =
                            normalizeJid(
                                getSender(
                                    message
                                )
                            );

                        const identityList = [
                            ...allIds,
                            ...(fromMe
                                ? [
                                    global.BOT_NUMBER,
                                    global.BOT_LID,
                                    numberToJid(
                                        getConfiguredBotNumber()
                                    )
                                ]
                                : [])
                        ]
                            .filter(Boolean)
                            .map(
                                normalizeJid
                            );

                        const isGroup =
                            jid.endsWith(
                                '@g.us'
                            );

                        /* ==================================================
                           ACCESS
                        ================================================== */

                        let owner =
                            isOwnerIdentity(
                                identityList
                            );

                        let sudo =
                            isSudoIdentity(
                                identityList
                            );

                        if (fromMe) {
                            owner = true;
                        }

                        const privileged =
                            owner ||
                            sudo ||
                            fromMe;

                        /* ==================================================
                           MUTE / BAN
                        ================================================== */

                        /*
                         * IMPORTANT MUTE FIX:
                         *
                         * Instead of checking only "sender",
                         * we check every identity WhatsApp gave us.
                         *
                         * This fixes:
                         *
                         * @s.whatsapp.net
                         * @lid
                         * participantPn
                         * senderPn
                         * participantAlt
                         */
                        const isMuted =
                            isGroup &&
                            !privileged &&
                            !fromMe &&
                            allIds.some(
                                id =>
                                    isUserMuted(
                                        jid,
                                        id
                                    )
                            );

                        const isBanned =
                            !privileged &&
                            !fromMe &&
                            global.bannedUsers.has(
                                sender
                            );

                        if (isBanned) {
                            console.log(
                                `🚫 Banned user blocked: ${sender}`
                            );

                            continue;
                        }

                        if (isMuted) {
                            console.log(
                                `🔇 Muted user blocked: ${sender} in ${jid}`
                            );

                            continue;
                        }

                        /* ==================================================
                           MESSAGE TEXT
                        ================================================== */

                        const text =
                            getTextFromMessage(
                                message
                            );

                        if (!text) {
                            continue;
                        }

                        /* ==================================================
                           COMMAND PARSER
                        ================================================== */

                        const parsed =
                            parseCommand(
                                text
                            );

                        if (!parsed) {
                            continue;
                        }

                        /* ==================================================
                           DEBUG
                        ================================================== */

                        console.log('');

                        console.log(
                            '📩 COMMAND'
                        );

                        console.log(
                            `👤 Sender: ${
                                sender ||
                                'unknown'
                            }`
                        );

                        console.log(
                            `💬 Command: ${parsed.raw}`
                        );

                        console.log(
                            `🤖 From me: ${fromMe}`
                        );

                        console.log(
                            `👑 Owner: ${owner}`
                        );

                        console.log(
                            `🛡️ Sudo: ${sudo}`
                        );

                        console.log(
                            `🔐 Privileged: ${privileged}`
                        );

                        /* ==================================================
                           PRIVATE MODE
                        ================================================== */

                        if (
                            !global.isPublic &&
                            !privileged &&
                            !fromMe
                        ) {
                            console.log(
                                '⛔ Private mode blocked command.'
                            );

                            continue;
                        }

                        /* ==================================================
                           PLUGIN
                        ================================================== */

                        const plugin =
                            global.plugins.get(
                                parsed.command
                            );

                        if (!plugin) {
                            console.log(
                                `⚠️ No plugin found for /${parsed.command}`
                            );

                            if (
                                global.isPublic ||
                                privileged ||
                                fromMe
                            ) {
                                /*
                                 * Intentionally empty.
                                 * No "command not found" reply.
                                 */
                                await replyTo(
                                    sock,
                                    message,
                                    ``
                                );
                            }

                            continue;
                        }

                        /* ==================================================
                           EXECUTE
                        ================================================== */

                        await executePlugin(
                            sock,
                            plugin,
                            message,
                            parsed,
                            sender,
                            jid,
                            isGroup,
                            owner,
                            sudo,
                            privileged
                        );
                    } catch (error) {
                        console.error(
                            '❌ Message handler error:',
                            error
                        );
                    }
                }
            }
        );

        /* ================================================================
           GROUP PARTICIPANTS
        ================================================================ */

        sock.ev.on(
            'group-participants.update',
            async ({
                id,
                participants,
                action
            }) => {
                try {
                    if (
                        action === 'add' &&
                        global.welcome[id]
                    ) {
                        for (
                            const participant of participants
                        ) {
                            const template =
                                global.welcomeMsg[id] ||
                                '👋 Welcome @{user}!';

                            const text =
                                template.replace(
                                    '{user}',
                                    `@${participant.split('@')[0]}`
                                );

                            await sock.sendMessage(
                                id,
                                {
                                    text,
                                    mentions: [
                                        participant
                                    ]
                                }
                            );
                        }
                    }

                    if (
                        action === 'remove' &&
                        global.goodbye[id]
                    ) {
                        for (
                            const participant of participants
                        ) {
                            const template =
                                global.goodbyeMsg[id] ||
                                '👋 Goodbye @{user}!';

                            const text =
                                template.replace(
                                    '{user}',
                                    `@${participant.split('@')[0]}`
                                );

                            await sock.sendMessage(
                                id,
                                {
                                    text,
                                    mentions: [
                                        participant
                                    ]
                                }
                            );
                        }
                    }
                } catch (error) {
                    console.error(
                        '❌ Group participant error:',
                        error.message
                    );
                }
            }
        );

        return sock;
    } catch (error) {
        console.error(
            '❌ Failed to start WhatsApp:',
            error
        );

        currentSocket = null;

        if (!reconnecting) {
            reconnecting = true;

            setTimeout(
                () => {
                    reconnecting =
                        false;

                    startBot()
                        .catch(
                            err =>
                                console.error(
                                    'Reconnect failed:',
                                    err
                                )
                        );
                },
                5000
            );
        }

        return null;
    }
}

/* ==========================================================================
   EXPORTS
========================================================================== */

module.exports = {
    startBot,
    loadPlugins,
    parseCommand,
    normalizeNumber,
    normalizeJid,
    numberToJid,
    isOwnerIdentity,
    isSudoIdentity,
    isGroupAdmin,
    isBotAdmin,
    getGroupMetadata,
    getTextFromMessage,
    getAllUserIds,
    getSender,
    getQuotedMessage,
    getMediaType,
    getMediaMessage,
    downloadMedia,
    downloadQuotedMedia,
    downloadAnyMedia,
    sendText,
    replyTo,
    getMuteKey,
    isUserMuted
};