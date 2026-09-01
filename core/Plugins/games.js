const choices = ['rock', 'paper', 'scissors'];

module.exports = [
    {
        name: 'games',
        alias: ['game'],
        description: 'Show available games',
        category: 'GAMES',

        async execute({ reply }) {
            await reply(
                `🎮 *PRIME GAMES*\n\n` +
                `/quiz\n` +
                `/rps rock\n` +
                `/coin\n` +
                `/dice\n` +
                `/slots\n` +
                `/8ball question`
            );
        }
    },

    {
        name: 'rps',
        description: 'Rock Paper Scissors',
        category: 'GAMES',

        async execute({ reply, text }) {
            const player = text.toLowerCase().trim();

            if (!choices.includes(player)) {
                return reply('✊ Usage: /rps rock\nOptions: rock, paper, scissors');
            }

            const bot = choices[Math.floor(Math.random() * choices.length)];

            let result = 'Draw!';

            if (
                (player === 'rock' && bot === 'scissors') ||
                (player === 'paper' && bot === 'rock') ||
                (player === 'scissors' && bot === 'paper')
            ) {
                result = 'You win! 🎉';
            } else if (player !== bot) {
                result = 'I win! 🤖';
            }

            await reply(
                `🎮 *ROCK PAPER SCISSORS*\n\n` +
                `You: ${player}\n` +
                `Bot: ${bot}\n\n` +
                `*${result}*`
            );
        }
    },

    {
        name: 'coin',
        alias: ['flip'],
        description: 'Flip a coin',
        category: 'GAMES',

        async execute({ reply }) {
            const result = Math.random() < 0.5 ? 'HEADS 🪙' : 'TAILS 🪙';

            await reply(`🪙 *COIN FLIP*\n\n${result}`);
        }
    },

    {
        name: 'dice',
        description: 'Roll a dice',
        category: 'GAMES',

        async execute({ reply }) {
            const result = Math.floor(Math.random() * 6) + 1;

            await reply(`🎲 *DICE ROLL*\n\nYou rolled: *${result}*`);
        }
    },

    {
        name: 'slots',
        description: 'Play slots',
        category: 'GAMES',

        async execute({ reply }) {
            const symbols = ['🍒', '🍋', '⭐', '💎', '7️⃣'];

            const a = symbols[Math.floor(Math.random() * symbols.length)];
            const b = symbols[Math.floor(Math.random() * symbols.length)];
            const c = symbols[Math.floor(Math.random() * symbols.length)];

            const win = a === b && b === c;

            await reply(
                `🎰 *SLOTS*\n\n` +
                `| ${a} | ${b} | ${c} |\n\n` +
                (win ? '🎉 JACKPOT!' : '😅 Try again!')
            );
        }
    },

    {
        name: '8ball',
        description: 'Ask the magic 8-ball',
        category: 'GAMES',

        async execute({ reply, text }) {
            if (!text) {
                return reply('🎱 Usage: /8ball Will I become successful?');
            }

            const answers = [
                'Yes.',
                'Definitely.',
                'Most likely.',
                'Ask again later.',
                'Maybe.',
                'Probably not.',
                'No.',
                'I do not think so.'
            ];

            const answer =
                answers[Math.floor(Math.random() * answers.length)];

            await reply(
                `🎱 *MAGIC 8-BALL*\n\n` +
                `Question: ${text}\n\n` +
                `Answer: *${answer}*`
            );
        }
    },

    {
        name: 'quiz',
        description: 'Answer a quiz question',
        category: 'GAMES',

        async execute({ reply }) {
            await reply(
                `🧠 *QUIZ*\n\n` +
                `What is the capital of Nigeria?\n\n` +
                `A) Lagos\n` +
                `B) Abuja\n` +
                `C) Kano\n` +
                `D) Ibadan\n\n` +
                `Answer: B`
            );
        }
    }
];