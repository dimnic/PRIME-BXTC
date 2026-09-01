
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

/*
 * ============================================================
 * PRIME BOT — MEDIA CONVERTER
 * ============================================================
 *
 * Commands:
 *
 * /tovideo   — GIF/video sticker -> MP4
 * /toimage   — GIF/video sticker -> JPG
 * /togif     — video -> GIF
 * /tosticker — image/video/GIF -> WhatsApp sticker
 *
 * Usage:
 *
 * Reply to a GIF/video/image/sticker and use:
 *
 * /tovideo
 * /toimage
 * /togif
 * /tosticker
 *
 * FFmpeg must be installed and available in PATH.
 * ============================================================
 */

const TEMP_DIR = path.join(
    os.tmpdir(),
    'PRIME-bot-converter'
);

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}


/* ============================================================
   HELPERS
============================================================ */

function randomName(extension) {
    return path.join(
        TEMP_DIR,
        `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extension}`
    );
}


function fileExists(file) {
    try {
        return fs.existsSync(file);
    } catch (_) {
        return false;
    }
}


function removeFile(file) {
    try {
        if (file && fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    } catch (_) {}
}


function getQuotedMessage(context) {
    return (
        context?.quoted ||
        context?.message?.message
            ?.extendedTextMessage
            ?.contextInfo
            ?.quotedMessage ||
        null
    );
}


function getMediaMessage(context) {
    const quoted = getQuotedMessage(context);

    if (!quoted) {
        return null;
    }

    /*
     * Normal WhatsApp media.
     */
    if (quoted.imageMessage) {
        return {
            type: 'image',
            message: quoted.imageMessage,
            extension: 'jpg'
        };
    }

    if (quoted.videoMessage) {
        return {
            type: 'video',
            message: quoted.videoMessage,
            extension: 'mp4'
        };
    }

    if (quoted.audioMessage) {
        return {
            type: 'audio',
            message: quoted.audioMessage,
            extension: 'ogg'
        };
    }

    /*
     * WhatsApp animated/video sticker.
     */
    if (quoted.stickerMessage) {
        return {
            type: 'sticker',
            message: quoted.stickerMessage,
            extension: 'webp'
        };
    }

    return null;
}


/* ============================================================
   DOWNLOAD QUOTED MEDIA
============================================================ */

async function downloadMedia(context) {

    const media = getMediaMessage(context);

    if (!media) {
        throw new Error(
            'No supported media found. Reply to an image, GIF, video, or sticker.'
        );
    }

    const inputFile =
        randomName(media.extension);

    let stream;

    try {

        /*
         * Baileys expects the actual media message object
         * and its media type.
         */
        stream =
            await downloadContentFromMessage(
                media.message,
                media.type === 'sticker'
                    ? 'sticker'
                    : media.type
            );

    } catch (error) {

        removeFile(inputFile);

        throw new Error(
            `Could not download the media: ${error.message || error}`
        );
    }

    const writeStream =
        fs.createWriteStream(inputFile);

    try {

        for await (const chunk of stream) {
            writeStream.write(chunk);
        }

        await new Promise(
            (resolve, reject) => {

                writeStream.on(
                    'finish',
                    resolve
                );

                writeStream.on(
                    'error',
                    reject
                );

                writeStream.end();
            }
        );

    } catch (error) {

        try {
            writeStream.destroy();
        } catch (_) {}

        removeFile(inputFile);

        throw new Error(
            `Failed to save media: ${error.message || error}`
        );
    }

    if (!fileExists(inputFile)) {
        throw new Error(
            'Downloaded media file was not created.'
        );
    }

    return {
        file: inputFile,
        type: media.type,
        extension: media.extension
    };
}


/* ============================================================
   FFMPEG
============================================================ */

function runFFmpeg(args) {

    return new Promise(
        (resolve, reject) => {

            const process =
                spawn(
                    'ffmpeg',
                    [
                        '-hide_banner',
                        '-loglevel',
                        'error',
                        '-y',
                        ...args
                    ],
                    {
                        windowsHide: true
                    }
                );

            let stderr = '';

            process.stderr.on(
                'data',
                chunk => {
                    stderr += chunk.toString();
                }
            );

            process.on(
                'error',
                error => {

                    if (
                        error.code ===
                        'ENOENT'
                    ) {

                        reject(
                            new Error(
                                'FFmpeg was not found in PATH. Make sure `ffmpeg -version` works in PowerShell.'
                            )
                        );

                        return;
                    }

                    reject(error);
                }
            );

            process.on(
                'close',
                code => {

                    if (code === 0) {
                        resolve();
                        return;
                    }

                    reject(
                        new Error(
                            stderr.trim() ||
                            `FFmpeg exited with code ${code}`
                        )
                    );
                }
            );
        }
    );
}


/* ============================================================
   CONVERSION FUNCTIONS
============================================================ */

async function convertToVideo(input) {

    const output =
        randomName('mp4');

    /*
     * Good compatibility with WhatsApp.
     *
     * libx264:
     *   H.264 video
     *
     * aac:
     *   standard audio codec
     *
     * movflags:
     *   puts MP4 metadata where streaming clients expect it.
     */
    await runFFmpeg([
        '-i',
        input,

        '-map',
        '0:v:0',

        '-an',

        '-vf',
        'scale=trunc(iw/2)*2:trunc(ih/2)*2',

        '-c:v',
        'libx264',

        '-preset',
        'veryfast',

        '-crf',
        '28',

        '-pix_fmt',
        'yuv420p',

        '-movflags',
        '+faststart',

        output
    ]);

    return output;
}


async function convertToImage(input) {

    const output =
        randomName('jpg');

    /*
     * Extract the first frame.
     */
    await runFFmpeg([
        '-i',
        input,

        '-frames:v',
        '1',

        '-q:v',
        '3',

        output
    ]);

    return output;
}


async function convertToGif(input) {

    const output =
        randomName('gif');

    /*
     * Palette generation gives much better GIF quality
     * than directly encoding RGB frames.
     */
    await runFFmpeg([
        '-i',
        input,

        '-vf',
        'fps=12,scale=480:-1:flags=lanczos,split[s0][s1];' +
        '[s0]palettegen=max_colors=256[p];' +
        '[s1][p]paletteuse=dither=sierra2_4a',

        '-loop',
        '0',

        output
    ]);

    return output;
}


async function convertToSticker(input) {

    const output =
        randomName('webp');

    /*
     * WhatsApp sticker requirements:
     * - WebP
     * - max 512x512
     * - keep aspect ratio
     */
    await runFFmpeg([
        '-i',
        input,

        '-vf',
        'scale=512:512:force_original_aspect_ratio=decrease,' +
        'pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0',

        '-c:v',
        'libwebp',

        '-lossless',
        '0',

        '-q:v',
        '70',

        '-compression_level',
        '6',

        '-loop',
        '0',

        '-an',

        output
    ]);

    return output;
}


/* ============================================================
   FILE CLEANUP
============================================================ */

function cleanup(...files) {

    for (
        const file
        of files
    ) {
        removeFile(file);
    }
}


/* ============================================================
   SEND RESULT
============================================================ */

async function sendConverted(
    context,
    file,
    type
) {

    if (!fileExists(file)) {
        throw new Error(
            'Converted file does not exist.'
        );
    }

    const buffer =
        fs.readFileSync(file);

    if (type === 'video') {

        await context.sock.sendMessage(
            context.jid,
            {
                video: buffer,
                mimetype: 'video/mp4',
                fileName: 'PRIME-video.mp4',
                caption: '🎬 Converted by Prime Bot'
            },
            {
                quoted: context.message
            }
        );

        return;
    }

    if (type === 'image') {

        await context.sock.sendMessage(
            context.jid,
            {
                image: buffer,
                mimetype: 'image/jpeg',
                fileName: 'PRIME-image.jpg',
                caption: '🖼️ Converted by Prime Bot'
            },
            {
                quoted: context.message
            }
        );

        return;
    }

    if (type === 'gif') {

        await context.sock.sendMessage(
            context.jid,
            {
                document: buffer,
                mimetype: 'image/gif',
                fileName: 'PRIME-animation.gif',
                caption: '🎞️ Converted by Prime Bot'
            },
            {
                quoted: context.message
            }
        );

        return;
    }

    if (type === 'sticker') {

        await context.sock.sendMessage(
            context.jid,
            {
                sticker: buffer
            },
            {
                quoted: context.message
            }
        );

        return;
    }

    throw new Error(
        `Unknown output type: ${type}`
    );
}


/* ============================================================
   COMMON CONVERSION HANDLER
============================================================ */

async function convertCommand(
    context,
    outputType
) {

    let inputFile = null;
    let outputFile = null;

    try {

        const media =
            getMediaMessage(context);

        if (!media) {

            return context.reply(
                '❌ *NO MEDIA FOUND*\n\n' +
                'Reply to an image, GIF, video, or sticker and try again.\n\n' +
                'Example:\n' +
                '1. Send a GIF/video/sticker\n' +
                '2. Reply to it\n' +
                '3. Send /tovideo'
            );
        }

        await context.reply(
            '⏳ *PROCESSING MEDIA...*\n\n' +
            'Please wait while Prime Bot converts it.'
        );

        const downloaded =
            await downloadMedia(context);

        inputFile =
            downloaded.file;

        /*
         * Conversion.
         */
        if (outputType === 'video') {

            outputFile =
                await convertToVideo(
                    inputFile
                );

        } else if (outputType === 'image') {

            outputFile =
                await convertToImage(
                    inputFile
                );

        } else if (outputType === 'gif') {

            outputFile =
                await convertToGif(
                    inputFile
                );

        } else if (outputType === 'sticker') {

            outputFile =
                await convertToSticker(
                    inputFile
                );

        } else {

            throw new Error(
                'Unsupported conversion type.'
            );
        }

        /*
         * Send result.
         */
        await sendConverted(
            context,
            outputFile,
            outputType
        );

    } catch (error) {

        console.error(
            `❌ Media conversion failed (${outputType}):`,
            error
        );

        await context.reply(
            '❌ *CONVERSION FAILED*\n\n' +
            `${error.message || error}\n\n` +
            'Make sure FFmpeg is installed and the media is valid.'
        );

    } finally {

        cleanup(
            inputFile,
            outputFile
        );
    }
}


/* ============================================================
   PLUGINS
============================================================ */

module.exports = [

    /* ========================================================
       TO VIDEO
    ======================================================== */

    {
        name: 'tovideo',
        alias: [
            'togifvideo',
            'gifvideo',
            'convertvideo'
        ],
        description:
            'Convert a GIF, video sticker or video to MP4',
        category: 'CONVERTER',

        async execute(context) {

            await convertCommand(
                context,
                'video'
            );
        }
    },


    /* ========================================================
       TO IMAGE
    ======================================================== */

    {
        name: 'toimage',
        alias: [
            'photo',
            'convertimage',
            'jpg'
        ],
        description:
            'Convert GIF, video or sticker to an image',
        category: 'CONVERTER',

        async execute(context) {

            await convertCommand(
                context,
                'image'
            );
        }
    },


    /* ========================================================
       TO GIF
    ======================================================== */

    {
        name: 'togif',
        alias: [
            'gif',
            'convertgif'
        ],
        description:
            'Convert video to GIF',
        category: 'CONVERTER',

        async execute(context) {

            await convertCommand(
                context,
                'gif'
            );
        }
    },


    /* ========================================================
       TO STICKER
    ======================================================== */

    {
        name: 'tosticker',
        alias: [
            'sticker',
            'stik',
            'webp'
        ],
        description:
            'Convert image, GIF or video to WhatsApp sticker',
        category: 'CONVERTER',

        async execute(context) {

            await convertCommand(
                context,
                'sticker'
            );
        }
    }

];

