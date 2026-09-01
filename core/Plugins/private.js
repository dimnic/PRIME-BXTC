'use strict';

module.exports = [

    {
        name: 'private',
        alias: ['privatemode'],
        description: 'Switch bot to private mode',
        category: 'OWNER',

        async execute({
            reply,
            isOwner,
            isSudo
        }) {
            if (!isOwner && !isSudo) {
                return reply('❌ Owner/SUDO only.');
            }

            global.isPublic = false;

            await reply(
                '🔐 *PRIVATE MODE ENABLED*\n\nOnly the owner and SUDO users can use bot commands.'
            );
        }
    },


    {
        name: 'public',
        alias: ['publicmode'],
        description: 'Switch bot to public mode',
        category: 'OWNER',

        async execute({
            reply,
            isOwner,
            isSudo
        }) {
            if (!isOwner && !isSudo) {
                return reply('❌ Owner/SUDO only.');
            }

            global.isPublic = true;

            await reply(
                '🌐 *PUBLIC MODE ENABLED*\n\nEveryone can use normal bot commands.'
            );
        }
    },


    {
        name: 'mode',
        alias: ['botmode'],
        description: 'Show current bot mode',
        category: 'OWNER',

        async execute({
            reply,
            isOwner,
            isSudo
        }) {
            if (!isOwner && !isSudo) {
                return reply('❌ Owner/SUDO only.');
            }

            await reply(
                `⚙️ *BOT MODE*\n\nCurrent mode: *${global.isPublic ? 'PUBLIC' : 'PRIVATE'}*`
            );
        }
    },


    {
        name: 'reload',
        alias: ['reloadplugins'],
        description: 'Reload all plugins',
        category: 'OWNER',

        async execute({
            reply,
            isOwner,
            isSudo
        }) {
            if (!isOwner && !isSudo) {
                return reply('❌ Owner/SUDO only.');
            }

            /*
             * The loader is exported by sock.js.
             */

            const {
                loadPlugins
            } = require('../sock');

            await loadPlugins();

            await reply(
                `♻️ *PLUGINS RELOADED*\n\nCommands loaded: ${global.plugins.size}`
            );
        }
    },


    {
        name: 'stats',
        alias: ['botstats'],
        description: 'Show bot runtime statistics',
        category: 'OWNER',

        async execute({
            reply,
            isOwner,
            isSudo
        }) {
            if (!isOwner && !isSudo) {
                return reply('❌ Owner/SUDO only.');
            }

            const memory =
                process.memoryUsage();

            await reply(
                `📊 *PRIME BOT STATS*\n\n` +
                `🧩 Commands: ${global.plugins.size}\n` +
                `🧠 RAM: ${(memory.rss / 1024 / 1024).toFixed(1)} MB\n` +
                `⚙️ Node: ${process.version}\n` +
                `🌐 Mode: ${global.isPublic ? 'PUBLIC' : 'PRIVATE'}`
            );
        }
    }

];