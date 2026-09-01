'use strict';

module.exports = {
    command: 'help',
    aliases: ['h'],
    description: 'Show the Prime Bot command menu',
    category: 'GENERAL',

    async handler(ctx) {
        const map =
            global.plugins instanceof Map
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

        const groups = {};

        for (const plugin of unique.values()) {
            const category =
                String(
                    plugin.category || 'GENERAL'
                ).toUpperCase();

            if (!groups[category]) {
                groups[category] = [];
            }

            groups[category].push(plugin.name);
        }

        for (const list of Object.values(groups)) {
            list.sort();
        }

        const lines = [
            '👑 *PRIME BOT v2.1.0*',
            '',
            `🧩 ${unique.size} commands loaded.`,
            ''
        ];

        for (const category of Object.keys(groups).sort()) {
            lines.push(`*${category}*`);

            for (const name of groups[category]) {
                lines.push(`/${name}`);
            }

            lines.push('');
        }

        lines.push(
            'Use /command <name> for a description.',
            'Use /menu for the full menu.'
        );

        await ctx.reply(
            lines.join('\n')
        );
    }
};
