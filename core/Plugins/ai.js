
'use strict';

require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');

const API_KEY = process.env.GEMINI_API_KEY;

let ai = null;

if (API_KEY) {
    ai = new GoogleGenAI({
        apiKey: API_KEY
    });
}

/* ==========================================================================
   GEMINI HELPER
========================================================================== */

async function askGemini(prompt) {
    if (!ai) {
        throw new Error(
            'GEMINI_API_KEY is missing from the .env file.'
        );
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return (
        response?.text ||
        response?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || '')
            .join('') ||
        ''
    ).trim();
}

/* ==========================================================================
   FORMAT RESPONSE
========================================================================== */

function cleanResponse(text) {
    if (!text) {
        return '❌ Gemini returned an empty response.';
    }

    return `🤖 *PRIME AI*\n\n${text}`;
}

/* ==========================================================================
   PLUGINS
========================================================================== */

module.exports = [

    /* ----------------------------------------------------------------------
       AI
    ---------------------------------------------------------------------- */

    {
        name: 'ai',
        alias: ['ask', 'chat'],

        description: 'Ask Prime Bot AI a question',

        category: 'AI',

        async execute({ reply, text }) {

            if (!text || !text.trim()) {
                return reply(
                    '🤖 *PRIME AI*\n\n' +
                    'Ask me anything.\n\n' +
                    'Example:\n' +
                    '/ai explain JavaScript promises\n\n' +
                    'Aliases:\n' +
                    '/ask your question\n' +
                    '/chat your question'
                );
            }

            try {

                const answer =
                    await askGemini(
                        text.trim()
                    );

                await reply(
                    cleanResponse(answer)
                );

            } catch (error) {

                console.error(
                    '❌ Gemini error:',
                    error
                );

                let message =
                    error?.message ||
                    String(error);

                if (
                    message
                        .toLowerCase()
                        .includes('api')
                ) {
                    message =
                        'Gemini API configuration failed. Check your GEMINI_API_KEY in .env.';
                }

                await reply(
                    '❌ *PRIME AI ERROR*\n\n' +
                    message
                );
            }
        }
    },


    /* ----------------------------------------------------------------------
       IMAGINE
    ---------------------------------------------------------------------- */

    {
        name: 'imagine',
        alias: ['imageai'],

        description: 'Generate an AI image',

        category: 'AI',

        async execute({ reply, text }) {

            if (!text || !text.trim()) {
                return reply(
                    '🎨 *PRIME IMAGE AI*\n\n' +
                    'Usage:\n' +
                    '/imagine your image description\n\n' +
                    'Example:\n' +
                    '/imagine Toji standing in the rain at night'
                );
            }

            await reply(
                '🎨 *IMAGE AI*\n\n' +
                `Prompt:\n${text.trim()}\n\n` +
                '⚠️ Image generation is not enabled by the current Gemini text API setup yet.\n\n' +
                'Your `/ai`, `/ask` and `/chat` commands are now connected to Gemini.'
            );
        }
    },


    /* ----------------------------------------------------------------------
       SUMMARIZE
    ---------------------------------------------------------------------- */

    {
        name: 'summarize',
        alias: ['summary'],

        description: 'Summarize text using Gemini',

        category: 'AI',

        async execute({ reply, text }) {

            if (!text || !text.trim()) {
                return reply(
                    '📝 *PRIME SUMMARIZER*\n\n' +
                    'Usage:\n' +
                    '/summarize text to summarize'
                );
            }

            try {

                const prompt =
                    `Summarize the following text clearly and concisely. ` +
                    `Keep the important facts and main points. ` +
                    `Do not add information that is not present in the text.\n\n` +
                    `TEXT:\n${text.trim()}`;

                const answer =
                    await askGemini(prompt);

                await reply(
                    '📝 *PRIME SUMMARY*\n\n' +
                    answer
                );

            } catch (error) {

                console.error(
                    '❌ Gemini summarize error:',
                    error
                );

                await reply(
                    '❌ *SUMMARY ERROR*\n\n' +
                    (
                        error?.message ||
                        'Unable to generate the summary.'
                    )
                );
            }
        }
    }

];

