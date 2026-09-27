'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

/* =========================================================
   DIRECTORIES
========================================================= */

const TEMP_DIR = path.join(
    os.tmpdir(),
    'PRIME-bot-media'
);

const DATA_DIR = path.join(
    __dirname,
    '..',
    'data'
);

const STICKER_DATABASE = path.join(
    DATA_DIR,
    'user-stickers.json'
);

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/* =========================================================
   GENERAL HELPERS
========================================================= */

function randomName(extension = 'bin') {
    return path.join(
        TEMP_DIR,
        `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extension}`
    );
}

function cleanup(file) {
    try {
        if (file && fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    } catch {}
}

function getChatId(ctx) {
    return (
        ctx.jid ||
        ctx.chat ||
        ctx.from ||
        ctx.remoteJid
    );
}

function getUserId(ctx) {
    return (
        ctx.sender ||
        ctx.user ||
        ctx.participant ||
        ctx.senderJid ||
        ctx.from ||
        ctx.jid
    );
}

function getArgsText(ctx) {
    if (typeof ctx.argsText === 'string') {
        return ctx.argsText.trim();
    }

    if (Array.isArray(ctx.args)) {
        return ctx.args.join(' ').trim();
    }

    return '';
}

function getQuotedMessage(ctx) {
    return (
        ctx.quoted ||
        ctx.quotedMessage ||
        ctx.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
        null
    );
}

function hasMedia(message) {
    if (!message) return false;

    return Boolean(
        message.imageMessage ||
        message.videoMessage ||
        message.stickerMessage ||
        message.audioMessage
    );
}

async function downloadMedia(ctx, message) {
    if (typeof ctx.downloadMedia === 'function') {
        return await ctx.downloadMedia(message);
    }

    if (typeof ctx.download === 'function') {
        return await ctx.download(message);
    }

    throw new Error(
        'downloadMedia() is not available in your bot context.'
    );
}

/* =========================================================
   STICKER DATABASE
========================================================= */

function loadStickerDatabase() {
    try {
        if (!fs.existsSync(STICKER_DATABASE)) {
            fs.writeFileSync(
                STICKER_DATABASE,
                JSON.stringify({}, null, 2)
            );

            return {};
        }

        return JSON.parse(
            fs.readFileSync(
                STICKER_DATABASE,
                'utf8'
            )
        );
    } catch (error) {
        console.error(
            'STICKER DATABASE ERROR:',
            error
        );

        return {};
    }
}

function saveStickerDatabase(database) {
    fs.writeFileSync(
        STICKER_DATABASE,
        JSON.stringify(
            database,
            null,
            2
        )
    );
}

/* =========================================================
   STICKER CREATOR
========================================================= */

async function createSticker(
    buffer,
    title = 'PRIME'
) {
    const sticker = new Sticker(
        buffer,
        {
            pack: title,
            author: 'PRIME',
            type: StickerTypes.FULL,
            quality: 100
        }
    );

    return await sticker.build();
}

/* =========================================================
   FFMPEG
========================================================= */

function runFFmpeg(args) {
    return new Promise(
        (resolve, reject) => {

            const process = spawn(
                'ffmpeg',
                args,
                {
                    windowsHide: true
                }
            );

            let stderr = '';

            process.stderr.on(
                'data',
                data => {
                    stderr += data.toString();
                }
            );

            process.on(
                'error',
                reject
            );

            process.on(
                'close',
                code => {

                    if (code === 0) {
                        resolve();
                    } else {
                        reject(
                            new Error(
                                stderr ||
                                `FFmpeg exited with code ${code}`
                            )
                        );
                    }
                }
            );
        }
    );
}

/* =========================================================
   MEDIA DETECTION
========================================================= */

function detectMedia(message) {

    if (!message) {
        return null;
    }

    if (message.imageMessage) {
        return 'image';
    }

    if (message.videoMessage) {
        return 'video';
    }

    if (message.stickerMessage) {
        return 'sticker';
    }

    if (message.audioMessage) {
        return 'audio';
    }

    return null;
}

/* =========================================================
   RESOLUTION
========================================================= */

function getResolution(
    message,
    fallbackWidth = 720,
    fallbackHeight = 720
) {

    if (!message) {
        return {
            width: fallbackWidth,
            height: fallbackHeight
        };
    }

    const media =
        message.imageMessage ||
        message.videoMessage ||
        message.stickerMessage;

    return {
        width:
            media?.width ||
            fallbackWidth,

        height:
            media?.height ||
            fallbackHeight
    };
}

/* =========================================================
   IMAGE ENHANCEMENT
========================================================= */

async function enhanceImage(
    input,
    output
) {

    await runFFmpeg([
        '-y',

        '-i',
        input,

        '-vf',
        'scale=iw*2:ih*2:flags=lanczos,unsharp=5:5:1.0:5:5:0.0',

        '-q:v',
        '2',

        output
    ]);

    return output;
}

/* =========================================================
   VIDEO ENHANCEMENT
========================================================= */

async function enhanceVideo(
    input,
    output
) {

    await runFFmpeg([
        '-y',

        '-i',
        input,

        '-vf',
        'scale=iw*2:ih*2:flags=lanczos,unsharp=5:5:1.0:5:5:0.0',

        '-c:v',
        'libx264',

        '-preset',
        'medium',

        '-crf',
        '20',

        '-c:a',
        'aac',

        '-b:a',
        '128k',

        output
    ]);

    return output;
}

/* =========================================================
   TO IMAGE
========================================================= */

const toimg = {

    name: 'toimg',

    aliases: [
        'toimage'
    ],

    category: 'media',

    description:
        'Convert a sticker to an image.',

    async execute(ctx) {

        let input = null;
        let output = null;

        try {

            const quoted =
                getQuotedMessage(ctx);

            if (!quoted?.stickerMessage) {

                return ctx.reply(
                    '❌ Reply to a sticker with `/toimg`.'
                );
            }

            const buffer =
                await downloadMedia(
                    ctx,
                    quoted
                );

            if (!buffer) {
                return ctx.reply(
                    '❌ Could not download the sticker.'
                );
            }

            input =
                randomName('webp');

            output =
                randomName('png');

            fs.writeFileSync(
                input,
                buffer
            );

            await runFFmpeg([
                '-y',

                '-i',
                input,

                '-frames:v',
                '1',

                output
            ]);

            const image =
                fs.readFileSync(output);

            await ctx.sock.sendMessage(
                getChatId(ctx),
                {
                    image,
                    caption:
                        '🖼️ Converted by PRIME'
                },
                {
                    quoted: ctx.message
                }
            );

        } catch (error) {

            console.error(
                'TOIMG ERROR:',
                error
            );

            await ctx.reply(
                `❌ Failed to convert sticker.\n\n${error.message}`
            );

        } finally {

            cleanup(input);
            cleanup(output);
        }
    }
};

/* =========================================================
   TO VIDEO
========================================================= */

const tovideo = {

    name: 'tovideo',

    aliases: [
        'tovid'
    ],

    category: 'media',

    description:
        'Convert a sticker to video.',

    async execute(ctx) {

        let input = null;
        let output = null;

        try {

            const quoted =
                getQuotedMessage(ctx);

            if (!quoted?.stickerMessage) {

                return ctx.reply(
                    '❌ Reply to a sticker with `/tovideo`.'
                );
            }

            const buffer =
                await downloadMedia(
                    ctx,
                    quoted
                );

            if (!buffer) {
                return ctx.reply(
                    '❌ Could not download sticker.'
                );
            }

            input =
                randomName('webp');

            output =
                randomName('mp4');

            fs.writeFileSync(
                input,
                buffer
            );

            await runFFmpeg([
                '-y',

                '-i',
                input,

                '-movflags',
                '+faststart',

                '-pix_fmt',
                'yuv420p',

                output
            ]);

            const video =
                fs.readFileSync(output);

            await ctx.sock.sendMessage(
                getChatId(ctx),
                {
                    video,
                    mimetype:
                        'video/mp4',
                    caption:
                        '🎬 Converted by PRIME'
                },
                {
                    quoted: ctx.message
                }
            );

        } catch (error) {

            console.error(
                'TOVIDEO ERROR:',
                error
            );

            await ctx.reply(
                `❌ Failed to convert sticker.\n\n${error.message}`
            );

        } finally {

            cleanup(input);
            cleanup(output);
        }
    }
};

/* =========================================================
   STICKER
========================================================= */

const sticker = {

    name: 'sticker',

    aliases: [
        's',
        'stiker'
    ],

    category: 'media',

    description:
        'Create a sticker with a custom title.',

    async execute(ctx) {

        try {

            const argsText =
                getArgsText(ctx);

            const userId =
                getUserId(ctx);

            const chatId =
                getChatId(ctx);

            if (!userId) {

                return ctx.reply(
                    '❌ Could not determine your WhatsApp ID.'
                );
            }

            if (!chatId) {

                return ctx.reply(
                    '❌ Could not determine the chat.'
                );
            }

            /* ==========================================
               DELETE PERSONAL STICKER
            ========================================== */

            const lower =
                argsText.toLowerCase();

            if (
                lower === 'delete' ||
                lower === 'remove'
            ) {

                const database =
                    loadStickerDatabase();

                if (!database[userId]) {

                    return ctx.reply(
                        '❌ You do not have a saved personal sticker.'
                    );
                }

                delete database[userId];

                saveStickerDatabase(
                    database
                );

                return ctx.reply(
                    '🗑️ Your personal sticker has been deleted.'
                );
            }

            /* ==========================================
               SHOW PERSONAL STICKER
            ========================================== */

            if (
                lower === 'mine' ||
                lower === 'mysticker'
            ) {

                const database =
                    loadStickerDatabase();

                if (!database[userId]) {

                    return ctx.reply(
                        '❌ You do not have a saved sticker.\n\n' +
                        'Create one with:\n' +
                        '`/sticker PRIME`'
                    );
                }

                const stickerBuffer =
                    Buffer.from(
                        database[userId].sticker,
                        'base64'
                    );

                return await ctx.sock.sendMessage(
                    chatId,
                    {
                        sticker:
                            stickerBuffer
                    },
                    {
                        quoted:
                            ctx.message
                    }
                );
            }

            /* ==========================================
               UPDATE PERSONAL STICKER
            ========================================== */

            if (
                lower === 'update' ||
                lower.startsWith('update ')
            ) {

                const customTitle =
                    argsText
                        .replace(
                            /^update\s*/i,
                            ''
                        )
                        .trim() ||
                    'PRIME';

                const quoted =
                    getQuotedMessage(ctx);

                if (
                    !quoted ||
                    !hasMedia(quoted)
                ) {

                    return ctx.reply(
                        '❌ Reply to an image or video.\n\n' +
                        'Example:\n' +
                        '`/sticker update ales is goated`'
                    );
                }

                const media =
                    await downloadMedia(
                        ctx,
                        quoted
                    );

                if (!media) {

                    return ctx.reply(
                        '❌ Could not download the media.'
                    );
                }

                const stickerBuffer =
                    await createSticker(
                        media,
                        customTitle
                    );

                const database =
                    loadStickerDatabase();

                database[userId] = {

                    sticker:
                        stickerBuffer.toString(
                            'base64'
                        ),

                    title:
                        customTitle,

                    author:
                        'PRIME',

                    updatedAt:
                        new Date().toISOString()
                };

                saveStickerDatabase(
                    database
                );

                await ctx.sock.sendMessage(
                    chatId,
                    {
                        sticker:
                            stickerBuffer
                    },
                    {
                        quoted:
                            ctx.message
                    }
                );

                return;
            }

            /* ==========================================
               NORMAL STICKER
            ========================================== */

            const quoted =
                getQuotedMessage(ctx);

            if (
                !quoted ||
                !hasMedia(quoted)
            ) {

                return ctx.reply(
                    '🖼️ Reply to an image or video with:\n\n' +
                    '`/sticker`\n\n' +
                    'Custom title:\n' +
                    '`/sticker ales is goated`'
                );
            }

            const media =
                await downloadMedia(
                    ctx,
                    quoted
                );

            if (!media) {

                return ctx.reply(
                    '❌ Could not download the media.'
                );
            }

            /*
             * EVERYTHING AFTER /STICKER
             * BECOMES THE CUSTOM TITLE.
             *
             * Example:
             *
             * /sticker ales is goated
             *
             * Title:
             * ales is goated
             */

            const customTitle =
                argsText ||
                'PRIME';

            const stickerBuffer =
                await createSticker(
                    media,
                    customTitle
                );

            /* ==========================================
               SAVE PERSONAL STICKER
            ========================================== */

            const database =
                loadStickerDatabase();

            database[userId] = {

                sticker:
                    stickerBuffer.toString(
                        'base64'
                    ),

                title:
                    customTitle,

                author:
                    'PRIME',

                createdAt:
                    new Date().toISOString()
            };

            saveStickerDatabase(
                database
            );

            /* ==========================================
               SEND STICKER
            ========================================== */

            await ctx.sock.sendMessage(
                chatId,
                {
                    sticker:
                        stickerBuffer
                },
                {
                    quoted:
                        ctx.message
                }
            );

        } catch (error) {

            console.error(
                'STICKER ERROR:',
                error
            );

            return ctx.reply(
                '❌ Failed to create sticker.\n\n' +
                `Error: ${error.message}`
            );
        }
    }
};

/* =========================================================
   MY STICKER
========================================================= */

const mysticker = {

    name: 'mysticker',

    aliases: [
        'mystick',
        'mystk'
    ],

    category: 'media',

    description:
        'Send your saved personal sticker.',

    async execute(ctx) {

        try {

            const userId =
                getUserId(ctx);

            const chatId =
                getChatId(ctx);

            const database =
                loadStickerDatabase();

            if (!database[userId]) {

                return ctx.reply(
                    '❌ You do not have a saved sticker.\n\n' +
                    'Create one using:\n' +
                    '`/sticker your title`'
                );
            }

            const stickerBuffer =
                Buffer.from(
                    database[userId].sticker,
                    'base64'
                );

            await ctx.sock.sendMessage(
                chatId,
                {
                    sticker:
                        stickerBuffer
                },
                {
                    quoted:
                        ctx.message
                }
            );

        } catch (error) {

            console.error(
                'MYSTICKER ERROR:',
                error
            );

            return ctx.reply(
                `❌ Failed to send your sticker.\n\n${error.message}`
            );
        }
    }
};

/* =========================================================
   URL
========================================================= */

const tourl = {

    name: 'tourl',

    aliases: [
        'url'
    ],

    category: 'media',

    description:
        'Upload media and return a URL.',

    async execute(ctx) {

        try {

            const quoted =
                getQuotedMessage(ctx);

            if (
                !quoted ||
                !hasMedia(quoted)
            ) {

                return ctx.reply(
                    '❌ Reply to an image, video, sticker or audio.'
                );
            }

            return ctx.reply(
                '⚠️ URL upload requires an upload provider to be configured in your bot.'
            );

        } catch (error) {

            console.error(
                'TOURL ERROR:',
                error
            );

            return ctx.reply(
                `❌ ${error.message}`
            );
        }
    }
};

/* =========================================================
   SCREENSHOT
========================================================= */

const ss = {

    name: 'ss',

    aliases: [
        'screenshot'
    ],

    category: 'media',

    description:
        'Take a website screenshot.',

    async execute(ctx) {

        const args =
            getArgsText(ctx);

        if (!args) {

            return ctx.reply(
                '🌐 Usage:\n' +
                '`/ss https://example.com`'
            );
        }

        return ctx.reply(
            '⚠️ Website screenshot requires a browser/screenshot provider to be configured.'
        );
    }
};

/* =========================================================
   REMOVE BG
========================================================= */

const removebg = {

    name: 'removebg',

    aliases: [
        'rbg'
    ],

    category: 'media',

    description:
        'Remove an image background.',

    async execute(ctx) {

        const quoted =
            getQuotedMessage(ctx);

        if (
            !quoted ||
            !quoted.imageMessage
        ) {

            return ctx.reply(
                '❌ Reply to an image with `/removebg`.'
            );
        }

        return ctx.reply(
            '⚠️ Background removal requires a configured image-processing API.'
        );
    }
};

/* =========================================================
   ENHANCE
========================================================= */

const enhance = {

    name: 'enhance',

    aliases: [
        'upscale',
        'enh'
    ],

    category: 'media',

    description:
        'Enhance an image or video.',

    async execute(ctx) {

        let input = null;
        let output = null;

        try {

            const quoted =
                getQuotedMessage(ctx);

            if (
                !quoted ||
                !hasMedia(quoted)
            ) {

                return ctx.reply(
                    '❌ Reply to an image or video with `/enhance`.'
                );
            }

            const mediaType =
                detectMedia(quoted);

            if (
                mediaType !== 'image' &&
                mediaType !== 'video'
            ) {

                return ctx.reply(
                    '❌ Only images and videos can be enhanced.'
                );
            }

            const buffer =
                await downloadMedia(
                    ctx,
                    quoted
                );

            if (!buffer) {

                return ctx.reply(
                    '❌ Could not download the media.'
                );
            }

            if (mediaType === 'image') {

                input =
                    randomName('jpg');

                output =
                    randomName('jpg');

            } else {

                input =
                    randomName('mp4');

                output =
                    randomName('mp4');
            }

            fs.writeFileSync(
                input,
                buffer
            );

            if (mediaType === 'image') {

                await enhanceImage(
                    input,
                    output
                );

                await ctx.sock.sendMessage(
                    getChatId(ctx),
                    {
                        image:
                            fs.readFileSync(
                                output
                            ),

                        caption:
                            '✨ Enhanced by PRIME'
                    },
                    {
                        quoted:
                            ctx.message
                    }
                );

            } else {

                await enhanceVideo(
                    input,
                    output
                );

                await ctx.sock.sendMessage(
                    getChatId(ctx),
                    {
                        video:
                            fs.readFileSync(
                                output
                            ),

                        mimetype:
                            'video/mp4',

                        caption:
                            '✨ Enhanced by PRIME'
                    },
                    {
                        quoted:
                            ctx.message
                    }
                );
            }

        } catch (error) {

            console.error(
                'ENHANCE ERROR:',
                error
            );

            return ctx.reply(
                '❌ Enhancement failed.\n\n' +
                error.message
            );

        } finally {

            cleanup(input);
            cleanup(output);
        }
    }
};

/* =========================================================
   CAPTION
========================================================= */

const caption = {

    name: 'caption',

    aliases: [
        'cap'
    ],

    category: 'media',

    description:
        'Add a caption to media.',

    async execute(ctx) {

        const args =
            getArgsText(ctx);

        const quoted =
            getQuotedMessage(ctx);

        if (
            !quoted ||
            !hasMedia(quoted)
        ) {

            return ctx.reply(
                '❌ Reply to media and provide a caption.\n\n' +
                'Example:\n' +
                '`/caption PRIME`'
            );
        }

        if (!args) {

            return ctx.reply(
                '❌ Please provide a caption.'
            );
        }

        try {

            const media =
                await downloadMedia(
                    ctx,
                    quoted
                );

            const type =
                detectMedia(quoted);

            if (type === 'image') {

                await ctx.sock.sendMessage(
                    getChatId(ctx),
                    {
                        image:
                            media,

                        caption:
                            args
                    },
                    {
                        quoted:
                            ctx.message
                    }
                );

                return;
            }

            if (type === 'video') {

                await ctx.sock.sendMessage(
                    getChatId(ctx),
                    {
                        video:
                            media,

                        caption:
                            args
                    },
                    {
                        quoted:
                            ctx.message
                    }
                );

                return;
            }

            return ctx.reply(
                '❌ Caption currently supports images and videos.'
            );

        } catch (error) {

            console.error(
                'CAPTION ERROR:',
                error
            );

            return ctx.reply(
                `❌ Failed to add caption.\n\n${error.message}`
            );
        }
    }
};

/* =========================================================
   EXPORT ALL PLUGINS
========================================================= */

module.exports = [

    sticker,

    mysticker,

    toimg,

    tovideo,

    tourl,

    ss,

    removebg,

    enhance,

    caption

];