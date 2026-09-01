module.exports = [
    {
        name: 'calc',
        alias: ['calculate'],
        description: 'Calculate an expression',
        category: 'UTILITY',

        async execute({ reply, text }) {
            if (!text) {
                return reply('🧮 Usage: /calc 25 * 4');
            }

            try {
                if (!/^[0-9+\-*/().%\s]+$/.test(text)) {
                    return reply('❌ Only basic mathematical expressions are allowed.');
                }

                const result = Function(`"use strict"; return (${text})`)();

                await reply(`🧮 ${text} = *${result}*`);
            } catch {
                await reply('❌ Invalid calculation.');
            }
        }
    },

    {
        name: 'time',
        description: 'Show current time',
        category: 'UTILITY',

        async execute({ reply, text }) {
            const timezone = text || 'Africa/Lagos';

            try {
                const now = new Intl.DateTimeFormat('en-US', {
                    timeZone: timezone,
                    dateStyle: 'full',
                    timeStyle: 'long'
                }).format(new Date());

                await reply(`🕐 *TIME*\n\n${now}\n\nTimezone: ${timezone}`);
            } catch {
                await reply('❌ Invalid timezone.');
            }
        }
    },

    {
        name: 'weather',
        description: 'Show weather information',
        category: 'UTILITY',

        async execute({ reply, text }) {
            if (!text) {
                return reply('🌦️ Usage: /weather Lagos');
            }

            await reply(
                `🌦️ Weather requested for *${text}*.\n\n` +
                `Weather API is not configured yet.`
            );
        }
    },

    {
        name: 'translate',
        description: 'Translate text',
        category: 'UTILITY',

        async execute({ reply, text }) {
            if (!text) {
                return reply(
                    '🌍 Usage:\n' +
                    '/translate en Hello world'
                );
            }

            await reply(
                `🌍 Translation request:\n${text}\n\n` +
                `Translation API is not configured yet.`
            );
        }
    },

    {
        name: 'define',
        description: 'Define a word',
        category: 'UTILITY',

        async execute({ reply, text }) {
            if (!text) {
                return reply('📖 Usage: /define word');
            }

            await reply(
                `📖 Definition requested for: *${text}*\n\n` +
                `Dictionary API is not configured yet.`
            );
        }
    },

    {
        name: 'wiki',
        description: 'Search Wikipedia',
        category: 'UTILITY',

        async execute({ reply, text }) {
            if (!text) {
                return reply('📚 Usage: /wiki topic');
            }

            await reply(
                `📚 Wikipedia search:\n${text}\n\n` +
                `Wikipedia lookup is not configured yet.`
            );
        }
    },

    {
        name: 'country',
        description: 'Country information',
        category: 'UTILITY',

        async execute({ reply, text }) {
            if (!text) {
                return reply('🌍 Usage: /country Nigeria');
            }

            await reply(
                `🌍 Country requested: *${text}*\n\n` +
                `Country information API is not configured yet.`
            );
        }
    },

    {
        name: 'shortlink',
        alias: ['short'],
        description: 'Shorten a URL',
        category: 'UTILITY',

        async execute({ reply, text }) {
            if (!text) {
                return reply('🔗 Usage: /shortlink https://example.com');
            }

            await reply(
                `🔗 URL received:\n${text}\n\n` +
                `URL-shortening service is not configured yet.`
            );
        }
    },

    {
        name: 'qr',
        description: 'Generate QR code',
        category: 'UTILITY',

        async execute({ reply, text }) {
            if (!text) {
                return reply('📱 Usage: /qr text or URL');
            }

            await reply(
                `📱 QR request received:\n${text}\n\n` +
                `QR generation handler can be connected to the installed qrcode package.`
            );
        }
    }
];