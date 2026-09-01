
'use strict';

const fs = require('fs');
const path = require('path');

const config = require('../config');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SUDO_FILE = path.join(DATA_DIR, 'sudo.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/* ============================================================
   HELPERS
============================================================ */

function normalizeNumber(number) {
    let value = String(number || '').replace(/\D/g, '');

    if (value.startsWith('0') && value.length > 1) {
        value = '234' + value.slice(1);
    }

    return value;
}

function normalizeJid(jid) {
    if (!jid) {
        return '';
    }

    return String(jid)
        .replace(/:\d+@/, '@')
        .trim();
}

function extractNumber(jid) {
    if (!jid) {
        return '';
    }

    const normalized = normalizeJid(jid);

    const number = normalized
        .split('@')[0]
        .replace(/\D/g, '');

    return normalizeNumber(number);
}

function displayNumber(number) {
    const clean = normalizeNumber(number);
    return clean ? `+${clean}` : 'Unknown';
}

function uniqueNumbers(numbers) {
    return [
        ...new Set(
            (Array.isArray(numbers) ? numbers : [])
                .map(normalizeNumber)
                .filter(Boolean)
        )
    ];
}

/* ============================================================
   OWNER NUMBERS
============================================================ */

function getOwnerNumbers() {
    let owners = [];

    try {
        if (Array.isArray(config.OWNER_NUMBERS)) {
            owners = config.OWNER_NUMBERS;
        } else if (typeof config.getOwners === 'function') {
            owners = config.getOwners();
        }
    } catch (error) {
        console.error(
            '❌ Failed to read owner configuration:',
            error.message
        );
    }

    /*
     * getOwners() may return JIDs such as:
     * 2349136164617@s.whatsapp.net
     *
     * normalizeNumber() strips the JID down
     * to the phone number.
     */
    return uniqueNumbers(owners);
}

/* ============================================================
   SUDO FILE
============================================================ */

function loadSudoFile() {
    try {
        if (!fs.existsSync(SUDO_FILE)) {
            return [];
        }

        const raw = fs.readFileSync(
            SUDO_FILE,
            'utf8'
        );

        if (!raw.trim()) {
            return [];
        }

        const data = JSON.parse(raw);

        if (!Array.isArray(data)) {
            return [];
        }

        return uniqueNumbers(data);

    } catch (error) {

        console.error(
            '❌ sudo.json read error:',
            error.message
        );

        return [];
    }
}

function saveSudoFile(numbers) {
    try {

        const cleaned =
            uniqueNumbers(numbers);

        fs.writeFileSync(
            SUDO_FILE,
            JSON.stringify(
                cleaned,
                null,
                2
            ),
            'utf8'
        );

        return true;

    } catch (error) {

        console.error(
            '❌ sudo.json write error:',
            error.message
        );

        return false;
    }
}

/* ============================================================
   CONFIG SUDO
============================================================ */

function getConfigSudoNumbers() {
    let sudo = [];

    try {

        if (Array.isArray(config.SUDO_NUMBERS)) {
            sudo = config.SUDO_NUMBERS;
        } else if (typeof config.getSudo === 'function') {
            sudo = config.getSudo();
        }

    } catch (error) {

        console.error(
            '❌ Failed to read sudo configuration:',
            error.message
        );
    }

    return uniqueNumbers(sudo);
}

/* ============================================================
   ALL SUDO
============================================================ */

function getSudoNumbers() {

    const owners =
        new Set(getOwnerNumbers());

    const configSudo =
        getConfigSudoNumbers();

    const storedSudo =
        loadSudoFile();

    /*
     * Owners automatically have full access.
     * They do not need to appear in the sudo list.
     */
    return uniqueNumbers([
        ...configSudo,
        ...storedSudo
    ]).filter(
        number => !owners.has(number)
    );
}

/* ============================================================
   GLOBAL SUDO
============================================================ */

function updateGlobalSudo() {

    global.SUDO =
        getSudoNumbers().map(
            number =>
                `${number}@s.whatsapp.net`
        );

    return getSudoNumbers();
}

updateGlobalSudo();

/* ============================================================
   CONTEXT IDENTITY EXTRACTION
============================================================ */

function getSenderIdentities(context) {

    const message =
        context?.message ||
        context?.msg;

    const key =
        message?.key || {};

    const identities = [];

    const candidates = [

        key.participantPn,

        key.senderPn,

        key.participant,

        key.participantAlt,

        key.senderLid,

        key.remoteJid
    ];

    for (const candidate of candidates) {

        if (!candidate) {
            continue;
        }

        const normalized =
            normalizeJid(candidate);

        if (normalized) {
            identities.push(normalized);
        }
    }

    /*
     * sock.js already calculates these identities.
     * Include them if the plugin receives them.
     */
    if (Array.isArray(context?.senderIds)) {

        for (const identity of context.senderIds) {

            if (identity) {
                identities.push(
                    normalizeJid(identity)
                );
            }
        }
    }

    return [
        ...new Set(
            identities.filter(Boolean)
        )
    ];
}

function getSenderNumber(context) {

    const identities =
        getSenderIdentities(context);

    for (const identity of identities) {

        const number =
            extractNumber(identity);

        if (number) {
            return number;
        }
    }

    return '';
}

/* ============================================================
   IDENTITY MATCHING
============================================================ */

function identityMatchesNumber(
    identity,
    number
) {

    const identityNumber =
        extractNumber(identity);

    const configuredNumber =
        normalizeNumber(number);

    if (!identityNumber || !configuredNumber) {
        return false;
    }

    return identityNumber === configuredNumber;
}

function senderIsOwner(context) {

    /*
     * First trust sock.js.
     */
    if (context?.isOwner === true) {
        return true;
    }

    const identities =
        getSenderIdentities(context);

    const owners =
        getOwnerNumbers();

    return identities.some(
        identity =>
            owners.some(
                owner =>
                    identityMatchesNumber(
                        identity,
                        owner
                    )
            )
    );
}

function senderIsSudo(context) {

    /*
     * First trust sock.js.
     */
    if (
        context?.isSudo === true ||
        context?.isPrivileged === true
    ) {
        return true;
    }

    const identities =
        getSenderIdentities(context);

    const sudo =
        getSudoNumbers();

    return identities.some(
        identity =>
            sudo.some(
                number =>
                    identityMatchesNumber(
                        identity,
                        number
                    )
            )
    );
}

/* ============================================================
   ACCESS CHECKS
============================================================ */

async function ownerOnly(context) {

    if (senderIsOwner(context)) {
        return true;
    }

    await context.reply(
        '❌ *OWNER ONLY*\n\n' +
        'This command can only be used by the configured Prime Bot owner.'
    );

    return false;
}

async function privilegedOnly(context) {

    if (
        senderIsOwner(context) ||
        senderIsSudo(context)
    ) {
        return true;
    }

    await context.reply(
        '❌ *OWNER/SUDO ONLY*\n\n' +
        'You do not have permission to use this command.'
    );

    return false;
}

/* ============================================================
   OWNER PANEL
============================================================ */

function ownerPanel() {

    const owners =
        getOwnerNumbers();

    const sudo =
        getSudoNumbers();

    let text =
        '╭━━━〔 💎 PRIME BOT OWNER PANEL 〕━━━╮\n' +
        '┃\n' +
        '┃ 👑 *OWNER*\n';

    if (owners.length === 0) {

        text +=
            '┃  └─ No owner configured\n';

    } else {

        owners.forEach(
            (number, index) => {

                text +=
                    `┃  ${index + 1}. ${displayNumber(number)}\n`;
            }
        );
    }

    text +=
        '┃\n' +
        '┃ 🛡️ *SUDO ADMINS*\n';

    if (sudo.length === 0) {

        text +=
            '┃  └─ No sudo admins\n';

    } else {

        sudo.forEach(
            (number, index) => {

                text +=
                    `┃  ${index + 1}. ${displayNumber(number)}\n`;
            }
        );
    }

    text +=
        '┃\n' +
        '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n' +
        '⚙️ *OWNER COMMANDS*\n\n' +
        '/owner\n' +
        '/addsudo 234XXXXXXXXXX\n' +
        '/delsudo 234XXXXXXXXXX\n' +
        '/listsudo\n' +
        '/admincheck 234XXXXXXXXXX\n' +
        '/mode public\n' +
        '/mode private';

    return text;
}

/* ============================================================
   SUDO LIST
============================================================ */

function sudoList() {

    const owners =
        getOwnerNumbers();

    const sudo =
        getSudoNumbers();

    let text =
        '╭━━━〔 🛡️ PRIME BOT ADMINS 〕━━━╮\n' +
        '┃\n' +
        '┃ 👑 *OWNER*\n';

    if (owners.length === 0) {

        text +=
            '┃  └─ None configured\n';

    } else {

        owners.forEach(
            (number, index) => {

                text +=
                    `┃  ${index + 1}. ${displayNumber(number)}\n`;
            }
        );
    }

    text +=
        '┃\n' +
        '┃ 🛡️ *SUDO ADMINS*\n';

    if (sudo.length === 0) {

        text +=
            '┃  └─ None\n';

    } else {

        sudo.forEach(
            (number, index) => {

                text +=
                    `┃  ${index + 1}. ${displayNumber(number)}\n`;
            }
        );
    }

    text +=
        '┃\n' +
        '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯';

    return text;
}

/* ============================================================
   PLUGINS
============================================================ */

module.exports = [

    /* ========================================================
       OWNER PANEL
    ======================================================== */

    {
        name: 'owner',

        alias: [
            'ownerpanel'
        ],

        description:
            'Show Prime Bot owner panel',

        category: 'OWNER',

        async execute(context) {

            if (
                !(await privilegedOnly(context))
            ) {
                return;
            }

            await context.reply(
                ownerPanel()
            );
        }
    },

    /* ========================================================
       LIST SUDO
    ======================================================== */

    {
        name: 'listsudo',

        alias: [
            'sudolist'
        ],

        description:
            'List owner and sudo administrators',

        category: 'OWNER',

        async execute(context) {

            if (
                !(await privilegedOnly(context))
            ) {
                return;
            }

            await context.reply(
                sudoList()
            );
        }
    },

    /* ========================================================
       ADD SUDO
    ======================================================== */

    {
        name: 'addsudo',

        description:
            'Add a sudo administrator',

        category: 'OWNER',

        async execute(context) {

            if (
                !(await ownerOnly(context))
            ) {
                return;
            }

            const number =
                normalizeNumber(
                    context.text
                );

            if (!number) {

                return context.reply(
                    '❌ *NUMBER REQUIRED*\n\n' +
                    'Usage:\n' +
                    '/addsudo 234XXXXXXXXXX'
                );
            }

            const owners =
                getOwnerNumbers();

            if (
                owners.includes(number)
            ) {

                return context.reply(
                    '⚠️ That number is already the *OWNER*.\n\n' +
                    'The owner does not need to be added as sudo.'
                );
            }

            const current =
                getSudoNumbers();

            if (
                current.includes(number)
            ) {

                return context.reply(
                    `⚠️ *${displayNumber(number)}* is already a sudo admin.`
                );
            }

            current.push(number);

            if (
                !saveSudoFile(current)
            ) {

                return context.reply(
                    '❌ Failed to save the sudo administrator.'
                );
            }

            updateGlobalSudo();

            await context.reply(
                '╭━━〔 🛡️ SUDO ADDED 〕━━╮\n' +
                '┃\n' +
                `┃ 👤 Number: ${displayNumber(number)}\n` +
                '┃ ✅ Access: Granted\n' +
                '┃ 💾 Persistent: Yes\n' +
                '┃\n' +
                '╰━━━━━━━━━━━━━━━━━━━━╯'
            );
        }
    },

    /* ========================================================
       DELETE SUDO
    ======================================================== */

    {
        name: 'delsudo',

        description:
            'Remove a sudo administrator',

        category: 'OWNER',

        async execute(context) {

            if (
                !(await ownerOnly(context))
            ) {
                return;
            }

            const number =
                normalizeNumber(
                    context.text
                );

            if (!number) {

                return context.reply(
                    '❌ *NUMBER REQUIRED*\n\n' +
                    'Usage:\n' +
                    '/delsudo 234XXXXXXXXXX'
                );
            }

            const owners =
                getOwnerNumbers();

            if (
                owners.includes(number)
            ) {

                return context.reply(
                    '❌ You cannot remove an owner with /delsudo.'
                );
            }

            const current =
                getSudoNumbers();

            if (
                !current.includes(number)
            ) {

                return context.reply(
                    `⚠️ *${displayNumber(number)}* is not currently a sudo admin.`
                );
            }

            const updated =
                current.filter(
                    item =>
                        item !== number
                );

            if (
                !saveSudoFile(updated)
            ) {

                return context.reply(
                    '❌ Failed to save the updated sudo list.'
                );
            }

            updateGlobalSudo();

            await context.reply(
                '╭━━〔 🗑️ SUDO REMOVED 〕━━╮\n' +
                '┃\n' +
                `┃ 👤 Number: ${displayNumber(number)}\n` +
                '┃ ❌ Access: Removed\n' +
                '┃ 💾 Persistent: Yes\n' +
                '┃\n' +
                '╰━━━━━━━━━━━━━━━━━━━━╯'
            );
        }
    },

    /* ========================================================
       ADMIN CHECK
    ======================================================== */

    {
        name: 'admincheck',

        alias: [
            'checkadmin'
        ],

        description:
            'Check owner or sudo status',

        category: 'OWNER',

        async execute(context) {

            let number =
                normalizeNumber(
                    context.text
                );

            if (!number) {
                number =
                    getSenderNumber(
                        context
                    );
            }

            if (!number) {

                return context.reply(
                    '❌ Could not determine a WhatsApp number.'
                );
            }

            const owners =
                getOwnerNumbers();

            const sudo =
                getSudoNumbers();

            if (
                owners.includes(number)
            ) {

                return context.reply(
                    '👑 *OWNER*\n\n' +
                    `📱 ${displayNumber(number)}\n\n` +
                    '✅ Full Prime Bot owner access.'
                );
            }

            if (
                sudo.includes(number)
            ) {

                return context.reply(
                    '🛡️ *SUDO ADMIN*\n\n' +
                    `📱 ${displayNumber(number)}\n\n` +
                    '✅ Privileged access is active.'
                );
            }

            await context.reply(
                '👤 *NORMAL USER*\n\n' +
                `📱 ${displayNumber(number)}\n\n` +
                '❌ No owner/sudo privileges.'
            );
        }
    },

    /* ========================================================
       MODE
    ======================================================== */

    {
        name: 'mode',

        description:
            'Change public/private bot mode',

        category: 'OWNER',

        async execute(context) {

            if (
                !(await ownerOnly(context))
            ) {
                return;
            }

            const mode =
                String(
                    context.text || ''
                )
                    .trim()
                    .toLowerCase();

            if (
                mode !== 'public' &&
                mode !== 'private'
            ) {

                return context.reply(
                    '⚙️ *BOT MODE*\n\n' +
                    '/mode public\n' +
                    '/mode private'
                );
            }

            global.isPublic =
                mode === 'public';

            await context.reply(
                '╭━━〔 ⚙️ MODE UPDATED 〕━━╮\n' +
                '┃\n' +
                `┃ 🌐 Mode: ${mode.toUpperCase()}\n` +
                `┃ 🔐 Access: ${global.isPublic
                    ? 'Normal commands are public'
                    : 'Owner/Sudo only'
                }\n` +
                '┃\n' +
                '╰━━━━━━━━━━━━━━━━━━━━╯'
            );
        }
    }
];


const OWNER_NUMBERS = [
    '2349136164617',
    'CLIENT_NUMBER_HERE'
];