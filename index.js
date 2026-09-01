'use strict';
require('dotenv').config();
const http = require('http');
const {
    startBot
} = require('./core/sock');

const PORT =
    Number(process.env.PORT) || 5000;

async function run() {

    console.log(
        '📦 Starting WhatsApp connection...'
    );

    /*
    |--------------------------------------------------------------------------
    | HTTP SERVER
    |--------------------------------------------------------------------------
    */

    const server =
        http.createServer(
            (req, res) => {

                res.writeHead(
                    200,
                    {
                        'Content-Type':
                            'text/plain; charset=utf-8'
                    }
                );

                res.end(
                    'PRIME BOT is running\n'
                );
            }
        );

    server.listen(
        PORT,
        () => {

            console.log('');
            console.log(
                '========================================'
            );

            console.log(
                '          💎 PRIME BOT'
            );

            console.log(
                '========================================'
            );

            console.log(
                `🌐 Listening on port ${PORT}`
            );

            console.log('');
        }
    );

    /*
    |--------------------------------------------------------------------------
    | START WHATSAPP
    |--------------------------------------------------------------------------
    */

    try {

        await startBot();

    } catch (error) {

        console.error('');
        console.error(
            '❌ PRIME BOT failed to start:'
        );

        console.error(error);

        process.exitCode = 1;
    }
}

/*
|--------------------------------------------------------------------------
| ERROR HANDLERS
|--------------------------------------------------------------------------
*/

process.on(
    'unhandledRejection',
    reason => {

        console.error(
            '❌ Unhandled promise rejection:'
        );

        console.error(reason);
    }
);

process.on(
    'uncaughtException',
    error => {

        console.error(
            '❌ Uncaught exception:'
        );

        console.error(error);
    }
);

run();