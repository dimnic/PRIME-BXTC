'use strict';

const fs = require('fs');
const path = require('path');

const MENU_IMAGE_CANDIDATES = [
    path.join(__dirname, '..', 'assets', 'menu.jpg'),
    path.join(__dirname, '..', 'assets', 'toji 2.jpg'),
    path.join(__dirname, '..', 'assets', 'toji.jpg'),
    path.join(__dirname, '..', 'assets', 'banner.jpg'),
    path.join(__dirname, '..', 'assets', 'bot.jpg')
];

function resolveMenuImage() {
    for (const p of MENU_IMAGE_CANDIDATES) {
        try {
            if (fs.existsSync(p) && fs.statSync(p).size > 0) return p;
        } catch (_) {}
    }
    return null;
}

function formatUptime(seconds) {
    seconds = Math.max(0, Math.floor(seconds || 0));

    const d = Math.floor(seconds / 86400);
    seconds %= 86400;

    const h = Math.floor(seconds / 3600);
    seconds %= 3600;

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    parts.push(`${s}s`);

    return parts.join(' ');
}

function prettyJid(value) {
    const raw = String(value || '');
    const number = raw.split('@')[0].replace(/\D/g, '');
    return number ? `+${number}` : 'Unknown';
}

function commandList() {
    const map = global.plugins instanceof Map
        ? global.plugins
        : new Map();

    const unique = new Map();

    for (const plugin of map.values()) {
        if (!plugin?.name) continue;
        unique.set(
            String(plugin.name).toLowerCase(),
            plugin
        );
    }

    return [...unique.values()].sort(
        (a, b) =>
            String(a.category || 'GENERAL').localeCompare(
                String(b.category || 'GENERAL')
            ) ||
            String(a.name).localeCompare(
                String(b.name)
            )
    );
}

function buildMenu() {
    const commands = commandList();
    const groups = {};

    for (const plugin of commands) {
        const category =
            String(plugin.category || 'GENERAL')
                .toUpperCase();

        if (!groups[category]) {
            groups[category] = [];
        }

        groups[category].push(plugin.name);
    }

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
        ...preferred.filter(c => groups[c]),
        ...Object.keys(groups)
            .filter(c => !preferred.includes(c))
            .sort()
    ];

    const lines = [
        '╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮',
        '┃       👑 *PRIME BOT*       ┃',
        '┃          v2.1.0            ┃',
        '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
        '',
        `🟢 Status: ONLINE`,
        `⏱️ Uptime: ${formatUptime(process.uptime())}`,
        `🧩 Commands: ${commands.length}`,
        ''
    ];

    for (const category of categories) {
        const title =
            category === 'FREEFIRE'
                ? 'FREE FIRE'
                : category;

        lines.push(
            `╭━━━〔 ${title} 〕━━━╮`
        );

        for (const name of groups[category]) {
            lines.push(`┃ /${name}`);
        }

        lines.push('╰━━━━━━━━━━━━━━━━╯', '');
    }

    lines.push(
        '💡 Use /command <name> for details.',
        '💡 /categories shows command counts.'
    );

    return lines.join('\n');
}

module.exports = {
    name: 'menu',

    alias: [
        'commands',
        'cmds'
    ],

    description:
        'Show the full Prime Bot command menu',

    category:
        'GENERAL',

   async execute(ctx) {
    const menuText = buildMenu();
    const imagePath = resolveMenuImage();
    const sock = ctx.sock;
    const jid = ctx.jid || ctx.from;

    if (imagePath && sock && jid && typeof sock.sendMessage === 'function') {
        try {
            const buffer = fs.readFileSync(imagePath);
            await sock.sendMessage(jid, {
                image: buffer,
                caption: menuText
            });
            return;
        } catch (err) {
            console.error('[menu] image send failed, falling back to text:', err.message);
        }
    }

    if (typeof ctx.reply === 'function') {
        await ctx.reply(menuText);
    }
}
};