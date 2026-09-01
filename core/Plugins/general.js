const os = require('os');

module.exports = [
    {
        name: 'ping',
        alias: [],
        description: 'Check bot response',
        category: 'GENERAL',

        async execute({ sock, msg }) {
            const start = Date.now();

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: '🏓 Pong!'
                },
                {
                    quoted: msg
                }
            );

            const ms = Date.now() - start;

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `⚡ Response: ${ms}ms`
                }
            );
        }
    },

    {
        name: 'alive',
        alias: [],
        description: 'Check if Prime Bot is online',
        category: 'GENERAL',

        async execute({ sock, msg }) {

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
`💎 *PRIME BOT*

✅ Bot is alive!
🤖 Version: 2.1.0
🌐 Mode: PUBLIC`
                },
                {
                    quoted: msg
                }
            );
        }
    },

    {
        name: 'help',
        alias: ['menu'],
        description: 'Show available commands',
        category: 'GENERAL',

        async execute({ sock, msg }) {

            const menu =
`╔════════════════════════════╗
║      💎 PRIME BOT       ║
╚════════════════════════════╝

📌 *GENERAL*

/help
/ping
/alive
/owner
/about
/runtime
/speed
/repo
/botinfo

🤖 *AI*

/ai
/ask
/chat
/imagine
/summarize

🎨 *MEDIA*

/sticker
/toimg
/tovideo
/tourl
/ss
/removebg
/enhance
/caption

🎵 *DOWNLOADER*

/play
/song
/ytmp3
/ytmp4
/ytsearch
/tiktok
/instagram
/facebook
/twitter
/mediafire

🌦️ *UTILITIES*

/weather
/translate
/define
/wiki
/calc
/time
/country
/shortlink
/qr

👥 *GROUP*

/kick
/add
/promote
/demote
/mute
/unmute
/ban
/unban
/warn
/unwarn
/warnings
/tagall
/hidetag
/admins
/groupinfo
/setname
/setdesc
/link
/revoke

🛡️ *PROTECTION*

/antilink
/antispam
/antitag
/antibot
/welcome
/goodbye
/setwelcome
/setgoodbye
/mutechat

🎮 *GAMES*

/games
/quiz
/rps
/coin
/dice
/slots
/8ball

🎰 *CASINO*

/balance
/daily
/flip
/roulette
/blackjack
/slots

🔥 *FREE FIRE*

/ff
/ffsens
/sensitivity

Use /help to show this menu again.
`;

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: menu
                },
                {
                    quoted: msg
                }
            );
        }
    },

       {
        name: 'about',
        alias: [],
        description: 'About Prime Bot',
        category: 'GENERAL',

        async execute({ sock, msg }) {

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
`💎 *PRIME BOT*

Version: 2.1.0
Platform: WhatsApp
Library: Baileys
Mode: PUBLIC

A multi-purpose WhatsApp bot with
AI, media, downloader, group,
protection, games and utility features.`
                },
                {
                    quoted: msg
                }
            );
        }
    },

    {
        name: 'runtime',
        alias: [],
        description: 'Show bot runtime',
        category: 'GENERAL',

        async execute({ sock, msg }) {

            const seconds =
                Math.floor(
                    process.uptime()
                );

            const days =
                Math.floor(seconds / 86400);

            const hours =
                Math.floor(
                    (seconds % 86400) / 3600
                );

            const minutes =
                Math.floor(
                    (seconds % 3600) / 60
                );

            const secs =
                seconds % 60;

            const runtime =
                `${days}d ${hours}h ${minutes}m ${secs}s`;

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
`⏱️ *PRIME BOT RUNTIME*

${runtime}`
                },
                {
                    quoted: msg
                }
            );
        }
    },

    {
        name: 'speed',
        alias: [],
        description: 'Check bot speed',
        category: 'GENERAL',

        async execute({ sock, msg }) {

            const start =
                process.hrtime.bigint();

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: '⚡ Testing speed...'
                },
                {
                    quoted: msg
                }
            );

            const end =
                process.hrtime.bigint();

            const ms =
                Number(
                    end - start
                ) / 1000000;

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
                        `⚡ Speed: ${ms.toFixed(2)} ms`
                }
            );
        }
    },

    {
        name: 'repo',
        alias: [],
        description: 'Show repository',
        category: 'GENERAL',

        async execute({ sock, msg }) {

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
`💎 *PRIME BOT*

Repository:
https://github.com/yourname/PRIME-bot

Version: 2.1.0`
                },
                {
                    quoted: msg
                }
            );
        }
    },

    {
        name: 'botinfo',
        alias: [],
        description: 'Show bot information',
        category: 'GENERAL',

        async execute({ sock, msg, config }) {

            const memory =
                process.memoryUsage();

            const memoryMB =
                (
                    memory.rss /
                    1024 /
                    1024
                ).toFixed(2);

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
`💎 *PRIME BOT INFORMATION*

Name: PRIME BOT
Version: 2.1.0
Mode: ${config.MODE.toUpperCase()}
Node: ${process.version}
Platform: ${process.platform}
Architecture: ${process.arch}
Memory: ${memoryMB} MB
CPU: ${os.cpus().length} cores`
                },
                {
                    quoted: msg
                }
            );
        }
    }
];