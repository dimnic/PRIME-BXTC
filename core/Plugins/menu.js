'use strict';

const fs = require('fs');
const path = require('path');

/* =========================================================
   AIZEN MENU
   ========================================================= */

const MENU_IMAGE_CANDIDATES = [
    path.join(__dirname, '..', 'assets', 'aizen.jpg'),
    path.join(__dirname, '..', 'assets', 'menu.jpg'),
    path.join(__dirname, '..', 'assets', 'toji.jpg'),
    path.join(__dirname, '..', 'assets', 'banner.jpg'),
    path.join(__dirname, '..', 'assets', 'bot.jpg')
];

/* =========================================================
   IMAGE
   ========================================================= */

function resolveMenuImage() {
    for (const file of MENU_IMAGE_CANDIDATES) {
        try {
            if (
                fs.existsSync(file) &&
                fs.statSync(file).size > 0
            ) {
                return file;
            }
        } catch (_) {}
    }

    return null;
}

/* =========================================================
   CURSIVE FONT
   ========================================================= */

function cursive(text) {
    const map = {
        A: '𝒜', B: 'ℬ', C: '𝒞', D: '𝒟', E: 'ℰ',
        F: 'ℱ', G: '𝒢', H: 'ℋ', I: 'ℐ', J: '𝒥',
        K: '𝒦', L: 'ℒ', M: 'ℳ', N: '𝒩', O: '𝒪',
        P: '𝒫', Q: '𝒬', R: 'ℛ', S: '𝒮', T: '𝒯',
        U: '𝒰', V: '𝒱', W: '𝒲', X: '𝒳', Y: '𝒴',
        Z: '𝒵',

        a: '𝒶', b: '𝒷', c: '𝒸', d: '𝒹', e: 'ℯ',
        f: '𝒻', g: 'ℊ', h: '𝒽', i: '𝒾', j: '𝒿',
        k: '𝓀', l: '𝓁', m: '𝓂', n: '𝓃', o: 'ℴ',
        p: '𝓅', q: '𝓆', r: '𝓇', s: '𝓈', t: '𝓉',
        u: '𝓊', v: '𝓋', w: '𝓌', x: '𝓍', y: '𝓎',
        z: '𝓏'
    };

    return String(text)
        .split('')
        .map(char => map[char] || char)
        .join('');
}

/* =========================================================
   RUNTIME
   ========================================================= */

function formatRuntime(seconds) {
    seconds = Math.max(
        0,
        Math.floor(seconds || 0)
    );

    const days = Math.floor(seconds / 86400);
    seconds %= 86400;

    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    const parts = [];

    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);

    parts.push(`${secs}s`);

    return parts.join(' ');
}

/* =========================================================
   MEMORY
   ========================================================= */

function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) {
        return '0 MB';
    }

    const mb = bytes / 1024 / 1024;

    if (mb < 1024) {
        return `${mb.toFixed(1)} MB`;
    }

    return `${(mb / 1024).toFixed(2)} GB`;
}

/* =========================================================
   JID
   ========================================================= */

function prettyJid(value) {
    if (!value) {
        return 'Unknown';
    }

    const number = String(value)
        .split('@')[0]
        .replace(/\D/g, '');

    return number
        ? `+${number}`
        : 'Unknown';
}

/* =========================================================
   USER
   ========================================================= */

function getUserJid(ctx) {
    return (
        ctx?.sender ||
        ctx?.participant ||
        ctx?.userJid ||
        ctx?.from ||
        ctx?.jid ||
        'Unknown'
    );
}

/* =========================================================
   OWNER
   ========================================================= */

function getOwner() {
    const possibleOwners = [
        global.OWNER_NUMBER,
        global.ownerNumber,
        global.OWNER_NUMBERS,
        global.ownerNumbers,
        global.SUDO
    ];

    for (const owner of possibleOwners) {
        if (
            Array.isArray(owner) &&
            owner.length
        ) {
            return prettyJid(owner[0]);
        }

        if (
            typeof owner === 'string' &&
            owner.trim()
        ) {
            return prettyJid(owner);
        }
    }

    try {
        const configPath = path.join(
            __dirname,
            '..',
            'config.js'
        );

        if (fs.existsSync(configPath)) {
            const config = require(configPath);

            const configOwner =
                config.OWNER_NUMBER ||
                config.ownerNumber ||
                config.OWNER_NUMBERS ||
                config.ownerNumbers ||
                config.SUDO;

            if (
                Array.isArray(configOwner) &&
                configOwner.length
            ) {
                return prettyJid(configOwner[0]);
            }

            if (
                typeof configOwner === 'string'
            ) {
                return prettyJid(configOwner);
            }
        }
    } catch (err) {
        console.error(
            '[AIZEN MENU] Owner lookup failed:',
            err.message
        );
    }

    return 'Not configured';
}

/* =========================================================
   COMMAND LIST
   ========================================================= */

function commandList() {
    const map =
        global.plugins instanceof Map
            ? global.plugins
            : new Map();

    const unique = new Map();

    for (const plugin of map.values()) {
        if (!plugin?.name) {
            continue;
        }

        unique.set(
            String(plugin.name).toLowerCase(),
            plugin
        );
    }

    return [...unique.values()].sort(
        (a, b) => {
            const categoryA =
                String(
                    a.category || 'GENERAL'
                ).toUpperCase();

            const categoryB =
                String(
                    b.category || 'GENERAL'
                ).toUpperCase();

            return (
                categoryA.localeCompare(categoryB) ||
                String(a.name).localeCompare(
                    String(b.name)
                )
            );
        }
    );
}

/* =========================================================
   GROUP COMMANDS
   ========================================================= */

function buildGroups(commands) {
    const groups = {};

    for (const plugin of commands) {
        const category = String(
            plugin.category || 'GENERAL'
        ).toUpperCase();

        if (!groups[category]) {
            groups[category] = [];
        }

        groups[category].push(plugin.name);
    }

    return groups;
}

/* =========================================================
   MENU
   ========================================================= */

function buildMenu(ctx) {
    const commands = commandList();
    const groups = buildGroups(commands);

    const preferred = [
        'GENERAL',
        'META',
        'AI',
        'MEDIA',
        'DOWNLOADER',
        'UTILITY',
        'UTILITIES',
        'GAMES',
        'CASINO',
        'ECONOMY',
        'PROFILE',
        'GROUP',
        'PROTECTION',
        'FREEFIRE',
        'SOCIAL'
    ];

    const categories = [
        ...preferred.filter(
            category => groups[category]
        ),

        ...Object.keys(groups)
            .filter(
                category =>
                    !preferred.includes(category)
            )
            .sort()
    ];

    const now = new Date();

    const time = now.toLocaleTimeString(
        'en-NG',
        {
            hour12: false
        }
    );

    const date = now.toLocaleDateString(
        'en-NG',
        {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }
    );

    const memory = process.memoryUsage();

    const user =
        prettyJid(
            getUserJid(ctx)
        );

    const owner =
        getOwner();

    const uptime =
        formatRuntime(
            process.uptime()
        );

    const BLUE = '🔵';

    const lines = [

        '╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮',
        `┃      ${BLUE} ${cursive('AIZEN')} ${BLUE}      ┃`,
        '┃          𝒱2.1.0             ┃',
        '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
        '',

        '╭━━━〔 🔵 𝓢𝓣𝓐𝓣𝓤𝓢 〕━━━╮',
        '┃ 🔵 Status : ONLINE',
        '┃ 🔵 Mode   : PUBLIC',
        '┃ 🔵 System : READY',
        '╰━━━━━━━━━━━━━━━━━━━━━━╯',
        '',

        '╭━━━〔 🔵 𝓤𝓢𝓔𝓡 〕━━━╮',
        `┃ 🔵 User  : ${user}`,
        `┃ 🔵 Owner : ${owner}`,
        '╰━━━━━━━━━━━━━━━━━━━━╯',
        '',

        '╭━━━〔 🔵 𝓡𝓤𝓝𝓣𝓘𝓜𝓔 〕━━━╮',
        `┃ 🔵 Runtime : ${uptime}`,
        `┃ 🔵 Time    : ${time}`,
        `┃ 🔵 Date    : ${date}`,
        `┃ 🔵 RAM     : ${formatBytes(memory.rss)}`,
        `┃ 🔵 Heap    : ${formatBytes(memory.heapUsed)}`,
        `┃ 🔵 Node    : ${process.version}`,
        `┃ 🔵 System  : ${process.platform}`,
        '╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
        '',

        '╭━━━〔 🔵 𝓢𝓨𝓢𝓣𝓔𝓜 〕━━━╮',
        `┃ 🔵 Commands   : ${commands.length}`,
        `┃ 🔵 Plugins    : ${commands.length}`,
        `┃ 🔵 Categories : ${categories.length}`,
        '╰━━━━━━━━━━━━━━━━━━━━━━╯',
        ''
    ];

    /* =====================================================
       COMMAND CATEGORIES
       ===================================================== */

    for (const category of categories) {

        const title =
            category === 'FREEFIRE'
                ? 'FREE FIRE'
                : category;

        lines.push(
            `╭━━━〔 🔵 ${cursive(title)} 〕━━━╮`
        );

        for (
            const name of groups[category]
        ) {
            lines.push(
                `┃ 🔵 /${name}`
            );
        }

        lines.push(
            '╰━━━━━━━━━━━━━━━━━━━━━━━━╯',
            ''
        );
    }

    /* =====================================================
       HELP
       ===================================================== */

    lines.push(
        '╭━━━〔 🔵 𝓗𝓔𝓛𝓟 〕━━━╮',
        '┃ 🔵 /menu',
        '┃ 🔵 /commands',
        '┃ 🔵 /categories',
        '┃ 🔵 /command <name>',
        '┃ 🔵 /sticker update',
        '╰━━━━━━━━━━━━━━━━━━━━╯',
        '',

        '╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮',
        `┃       🔵 ${cursive('AIZEN')} 🔵       ┃`,
        '┃       🔵 𝓛𝓘𝓥𝓔 𝓜𝓞𝓝𝓘𝓣𝓞𝓡 🔵      ┃',
        '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯'
    );

    return lines.join('\n');
}

/* =========================================================
   PLUGIN
   ========================================================= */

module.exports = {

    name: 'menu',

    alias: [
        'commands',
        'cmds',
        'help'
    ],

    description:
        'Show the live AIZEN command menu',

    category:
        'GENERAL',

    async execute(ctx) {

        const sock = ctx?.sock;

        const targetJid =
            ctx?.jid ||
            ctx?.from ||
            ctx?.chat ||
            ctx?.sender;

        if (
            !sock ||
            !targetJid
        ) {
            if (
                typeof ctx?.reply ===
                'function'
            ) {
                await ctx.reply(
                    '❌ Unable to determine the chat.'
                );
            }

            return;
        }

        const imagePath =
            resolveMenuImage();

        /* =================================================
           IMAGE + CAPTION TOGETHER
           ================================================= */

        if (imagePath) {

            try {

                const buffer =
                    fs.readFileSync(
                        imagePath
                    );

                const menuText =
                    buildMenu(ctx);

                /*
                 * Image and menu are sent
                 * as ONE WhatsApp message.
                 */

                const sentMessage =
                    await sock.sendMessage(
                        targetJid,
                        {
                            image: buffer,
                            caption: menuText
                        }
                    );

                /* =========================================
                   LIVE CLOCK / RUNTIME
                   ========================================= */

                const LIVE_DURATION = 60;

                let elapsed = 0;

                const timer =
                    setInterval(
                        async () => {

                            elapsed++;

                            if (
                                elapsed >
                                LIVE_DURATION
                            ) {
                                clearInterval(
                                    timer
                                );

                                return;
                            }

                            try {

                                const updatedMenu =
                                    buildMenu(ctx);

                                /*
                                 * Edit the SAME image
                                 * message by updating
                                 * its caption.
                                 */

                                await sock.sendMessage(
                                    targetJid,
                                    {
                                        image: buffer,
                                        caption: updatedMenu,
                                        edit: sentMessage.key
                                    }
                                );

                            } catch (err) {

                                console.error(
                                    '[AIZEN MENU] Live update failed:',
                                    err.message
                                );

                                clearInterval(
                                    timer
                                );
                            }

                        },
                        1000
                    );

                setTimeout(() => {
                    try {
                        clearInterval(timer);
                    } catch (_) {}
                }, 62000);

                return;

            } catch (err) {

                console.error(
                    '[AIZEN MENU] Image menu failed:',
                    err.message
                );
            }
        }

        /* =================================================
           FALLBACK IF NO IMAGE EXISTS
           ================================================= */

        const menuText =
            buildMenu(ctx);

        try {

            const sentMessage =
                await sock.sendMessage(
                    targetJid,
                    {
                        text: menuText
                    }
                );

            const LIVE_DURATION = 60;

            let elapsed = 0;

            const timer =
                setInterval(
                    async () => {

                        elapsed++;

                        if (
                            elapsed >
                            LIVE_DURATION
                        ) {
                            clearInterval(
                                timer
                            );

                            return;
                        }

                        try {

                            const updatedMenu =
                                buildMenu(ctx);

                            await sock.sendMessage(
                                targetJid,
                                {
                                    text: updatedMenu,
                                    edit: sentMessage.key
                                }
                            );

                        } catch (err) {

                            console.error(
                                '[AIZEN MENU] Update failed:',
                                err.message
                            );

                            clearInterval(
                                timer
                            );
                        }

                    },
                    1000
                );

            setTimeout(() => {
                try {
                    clearInterval(timer);
                } catch (_) {}
            }, 62000);

        } catch (err) {

            console.error(
                '[AIZEN MENU] Send failed:',
                err.message
            );

            if (
                typeof ctx?.reply ===
                'function'
            ) {
                await ctx.reply(
                    menuText
                );
            }
        }
    }
};