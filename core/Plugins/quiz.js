'use strict';

const quizzes = new Map();

const QUESTIONS = [
    {
        question: 'What is the capital of Nigeria?',
        options: ['A. Lagos', 'B. Abuja', 'C. Kano', 'D. Ibadan'],
        answer: 'B'
    },
    {
        question: 'Which planet is known as the Red Planet?',
        options: ['A. Earth', 'B. Venus', 'C. Mars', 'D. Jupiter'],
        answer: 'C'
    },
    {
        question: 'How many days are in a normal year?',
        options: ['A. 360', 'B. 364', 'C. 365', 'D. 366'],
        answer: 'C'
    },
    {
        question: 'Which animal is known as the King of the Jungle?',
        options: ['A. Tiger', 'B. Lion', 'C. Elephant', 'D. Leopard'],
        answer: 'B'
    },
    {
        question: 'What is 12 × 12?',
        options: ['A. 124', 'B. 132', 'C. 144', 'D. 154'],
        answer: 'C'
    },
    {
        question: 'Which ocean is the largest?',
        options: [
            'A. Atlantic Ocean',
            'B. Indian Ocean',
            'C. Arctic Ocean',
            'D. Pacific Ocean'
        ],
        answer: 'D'
    },
    {
        question: 'Which language is used to structure web pages?',
        options: ['A. HTML', 'B. Python', 'C. Java', 'D. C++'],
        answer: 'A'
    },
    {
        question: 'How many continents are there?',
        options: ['A. 5', 'B. 6', 'C. 7', 'D. 8'],
        answer: 'C'
    },
    {
        question: 'Which device measures temperature?',
        options: [
            'A. Barometer',
            'B. Thermometer',
            'C. Speedometer',
            'D. Compass'
        ],
        answer: 'B'
    },
    {
        question: 'What is the largest planet in our Solar System?',
        options: ['A. Earth', 'B. Saturn', 'C. Neptune', 'D. Jupiter'],
        answer: 'D'
    },
    {
        question: 'Which country is famous for the Great Wall?',
        options: ['A. Japan', 'B. China', 'C. India', 'D. Korea'],
        answer: 'B'
    },
    {
        question: 'How many sides does a triangle have?',
        options: ['A. 2', 'B. 3', 'C. 4', 'D. 5'],
        answer: 'B'
    },
    {
        question: 'What gas do humans need to breathe?',
        options: [
            'A. Oxygen',
            'B. Carbon dioxide',
            'C. Hydrogen',
            'D. Helium'
        ],
        answer: 'A'
    },
    {
        question: 'Which programming language is commonly used with Node.js?',
        options: ['A. JavaScript', 'B. PHP', 'C. Ruby', 'D. Swift'],
        answer: 'A'
    },
    {
        question: 'How many hours are in one day?',
        options: ['A. 12', 'B. 18', 'C. 24', 'D. 30'],
        answer: 'C'
    },
    {
        question: 'Which country is the largest by land area?',
        options: ['A. Canada', 'B. China', 'C. Russia', 'D. USA'],
        answer: 'C'
    },
    {
        question: 'What is the fastest land animal?',
        options: ['A. Lion', 'B. Cheetah', 'C. Horse', 'D. Leopard'],
        answer: 'B'
    },
    {
        question: 'How many letters are in the English alphabet?',
        options: ['A. 24', 'B. 25', 'C. 26', 'D. 27'],
        answer: 'C'
    },
    {
        question: 'Which instrument has black and white keys?',
        options: ['A. Guitar', 'B. Piano', 'C. Drum', 'D. Violin'],
        answer: 'B'
    },
    {
        question: 'What is the boiling point of water at sea level?',
        options: ['A. 50°C', 'B. 75°C', 'C. 100°C', 'D. 150°C'],
        answer: 'C'
    }
];

function shuffle(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

function formatQuestion(game) {
    const q = game.questions[game.index];

    return (
`💎 *PRIME QUIZ*

━━━━━━━━━━━━━━━━━━━━

❓ *Question ${game.index + 1}/${game.questions.length}*

${q.question}

${q.options.join('\n')}

━━━━━━━━━━━━━━━━━━━━

Reply with:

*A* • *B* • *C* • *D*

Or use:

/quiz A
/quiz B
/quiz C
/quiz D

🛑 /quiz stop`
    );
}

function getGrade(score, total) {
    const percentage = (score / total) * 100;

    if (percentage === 100) return '🏆 PERFECT SCORE!';
    if (percentage >= 80) return '🔥 Excellent!';
    if (percentage >= 60) return '👏 Very good!';
    if (percentage >= 40) return '👍 Good job!';

    return '💪 Keep practicing!';
}

/*
|--------------------------------------------------------------------------
| HANDLE QUIZ ANSWER
|--------------------------------------------------------------------------
*/

async function handleAnswer({
    sock,
    jid,
    answer
}) {
    const game = quizzes.get(jid);

    if (!game) {
        return false;
    }

    const choice = String(answer || '')
        .trim()
        .toUpperCase();

    if (!['A', 'B', 'C', 'D'].includes(choice)) {
        return false;
    }

    const current = game.questions[game.index];

    if (!current) {
        quizzes.delete(jid);
        return false;
    }

    const correct = choice === current.answer;

    if (correct) {
        game.score++;
    }

    game.index++;

    const result = correct
        ? `✅ *Correct!*\n\n+1 point`
        : `❌ *Wrong!*\n\nCorrect answer: *${current.answer}*`;

    /*
    |--------------------------------------------------------------------------
    | QUIZ FINISHED
    |--------------------------------------------------------------------------
    */

    if (game.index >= game.questions.length) {
        const score = game.score;
        const total = game.questions.length;

        quizzes.delete(jid);

        await sock.sendMessage(jid, {
            text:
`${result}

━━━━━━━━━━━━━━━━━━━━

🎉 *QUIZ COMPLETE!*

💎 Final Score:
*${score}/${total}*

${getGrade(score, total)}

━━━━━━━━━━━━━━━━━━━━

Use */quiz* to play again.`
        });

        return true;
    }

    /*
    |--------------------------------------------------------------------------
    | NEXT QUESTION
    |--------------------------------------------------------------------------
    */

    await sock.sendMessage(jid, {
        text:
`${result}

━━━━━━━━━━━━━━━━━━━━

${formatQuestion(game)}`
    });

    return true;
}

module.exports = {

    name: 'quiz',

    alias: ['trivia'],

    description: 'Play a 10-question quiz',

    category: 'GAMES',

    /*
    |--------------------------------------------------------------------------
    | Used by sock.js to detect an active quiz
    |--------------------------------------------------------------------------
    */

    isActive(jid) {
        return quizzes.has(jid);
    },

    /*
    |--------------------------------------------------------------------------
    | Used by sock.js for plain A/B/C/D answers
    |--------------------------------------------------------------------------
    */

    handleAnswer,

    /*
    |--------------------------------------------------------------------------
    | /quiz command
    |--------------------------------------------------------------------------
    */

    async execute({
        sock,
        jid,
        args
    }) {

        const action = String(args?.[0] || '')
            .trim()
            .toUpperCase();

        /*
        | Stop quiz
        */

        if (action === 'STOP') {

            if (!quizzes.has(jid)) {

                await sock.sendMessage(jid, {
                    text: 'ℹ️ You do not have an active quiz.'
                });

                return;
            }

            quizzes.delete(jid);

            await sock.sendMessage(jid, {
                text:
`🛑 *QUIZ STOPPED*

Your current quiz has been cancelled.

Use */quiz* to start a new quiz.`
            });

            return;
        }

        /*
        | /quiz A
        | /quiz B
        | /quiz C
        | /quiz D
        */

        if (['A', 'B', 'C', 'D'].includes(action)) {

            if (!quizzes.has(jid)) {

                await sock.sendMessage(jid, {
                    text:
`❌ No quiz is currently running.

Start one with:

*/quiz*`
                });

                return;
            }

            await handleAnswer({
                sock,
                jid,
                answer: action
            });

            return;
        }

        /*
        | Don't start another quiz if one already exists
        */

        if (quizzes.has(jid)) {

            await sock.sendMessage(jid, {
                text:
`⚠️ You already have a quiz running.

Answer with:

*A* • *B* • *C* • *D*

Or:

*/quiz stop*`
            });

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | START 10-QUESTION QUIZ
        |--------------------------------------------------------------------------
        */

        const selectedQuestions =
            shuffle(QUESTIONS).slice(0, 10);

        const game = {
            questions: selectedQuestions,
            index: 0,
            score: 0
        };

        quizzes.set(jid, game);

        await sock.sendMessage(jid, {
            text:
`🎮 *PRIME QUIZ STARTED!*

━━━━━━━━━━━━━━━━━━━━

You have *10 questions*.

🏆 Answer correctly to increase your score.

Good luck! 💎

━━━━━━━━━━━━━━━━━━━━

${formatQuestion(game)}`
        });
    }
};