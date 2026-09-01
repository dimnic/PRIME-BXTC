
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

const TEMP_DIR = path.join(
    os.tmpdir(),
    'PRIME-bot-media'
);

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/* ============================================================
   TEMP FILE HELPERS
============================================================ */

function makeTempFile(extension) {
    const id = crypto
        .randomBytes(10)
        .toString('hex');

    return path.join(
        TEMP_DIR,
        `${Date.now()}-${id}.${extension}`
    );
}

function cleanup(...files) {
    for (const file of files) {
        try {
            if (file && fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        } catch (_) {}
    }
}

/* ============================================================
   FFMPEG
============================================================ */

function runFFmpeg(args) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn(
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

        ffmpeg.stderr.on(
            'data',
            data => {
                stderr += data.toString();
            }
        );

        ffmpeg.on(
            'error',
            error => {
                reject(
                    new Error(
                        `FFmpeg could not start: ${error.message}`
                    )
                );
            }
        );

        ffmpeg.on(
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
    });
}

/* ============================================================
   MEDIA DETECTION
============================================================ */

function detectMedia(message) {
    const content =
        message?.message;

    if (!content) {
        return null;
    }

    if (content.imageMessage) {
        return {
            type: 'image',
            message: content.imageMessage,
            extension: 'jpg'
        };
    }

    if (content.videoMessage) {
        return {
            type: 'video',
            message: content.videoMessage,
            extension: 'mp4'
        };
    }

    if (content.stickerMessage) {
        return {
            type: 'sticker',
            message: content.stickerMessage,
            extension: 'webp'
        };
    }

    return null;
}

/* ============================================================
   QUOTED MESSAGE
============================================================ */

function getQuotedWAMessage(message) {
    const contextInfo =
        message?.message?.extendedTextMessage?.contextInfo ||
        message?.message?.imageMessage?.contextInfo ||
        message?.message?.videoMessage?.contextInfo ||
        message?.message?.documentMessage?.contextInfo ||
        message?.message?.stickerMessage?.contextInfo ||
        {};

    const quotedMessage =
        contextInfo?.quotedMessage;

    if (!quotedMessage) {
        return null;
    }

    return {
        key: {
            remoteJid:
                message?.key?.remoteJid,

            id:
                contextInfo?.stanzaId,

            participant:
                contextInfo?.participant
        },

        message: quotedMessage
    };
}

/* ============================================================
   ENHANCE OPTIONS
============================================================ */

function parseEnhanceOptions(text) {
    const input =
        String(text || '')
            .trim()
            .toLowerCase();

    let resolution = '2k';
    let fps = null;

    if (/\b4k\b/.test(input)) {
        resolution = '4k';
    }

    if (/\b2k\b/.test(input)) {
        resolution = '2k';
    }

    if (
        /\b120\s*fps\b/.test(input) ||
        /\b120\b/.test(input)
    ) {
        fps = 120;
    } else if (
        /\b60\s*fps\b/.test(input) ||
        /\b60\b/.test(input)
    ) {
        fps = 60;
    }

    return {
        resolution,
        fps
    };
}

/* ============================================================
   RESOLUTION
============================================================ */

function getResolution(resolution) {
    if (resolution === '4k') {
        return {
            width: 3840,
            height: 2160
        };
    }

    return {
        width: 2560,
        height: 1440
    };
}

/* ============================================================
   SCALE
============================================================ */

function makeVideoScaleFilter(
    width,
    height
) {
    return (
        `scale=${width}:${height}:` +
        `force_original_aspect_ratio=decrease,` +
        `pad=${width}:${height}:` +
        `(ow-iw)/2:(oh-ih)/2:color=black`
    );
}

/* ============================================================
   IMAGE ENHANCEMENT
============================================================ */

async function enhanceImage(
    input,
    output,
    resolution
) {
    const {
        width,
        height
    } = getResolution(
        resolution
    );

    const scale =
        makeVideoScaleFilter(
            width,
            height
        );

    await runFFmpeg([
        '-i',
        input,

        '-vf',
        [
            scale,

            /*
             * Mild denoise
             */
            'hqdn3d=1.0:1.0:4:4',

            /*
             * Sharpen
             */
            'unsharp=5:5:0.9:5:5:0.0'
        ].join(','),

        '-frames:v',
        '1',

        '-q:v',
        '2',

        output
    ]);
}

/* ============================================================
   VIDEO ENHANCEMENT
============================================================ */

async function enhanceVideo(
    input,
    output,
    resolution,
    fps
) {
    const {
        width,
        height
    } = getResolution(
        resolution
    );

    const filters = [
        makeVideoScaleFilter(
            width,
            height
        ),

        /*
         * Mild denoise
         */
        'hqdn3d=1.0:1.0:4:4',

        /*
         * Sharpen/detail
         */
        'unsharp=5:5:0.8:5:5:0.0'
    ];

    /*
     * Frame interpolation.
     *
     * This creates intermediate frames.
     *
     * 60 FPS:
     * good balance between quality and CPU.
     *
     * 120 FPS:
     * considerably heavier processing.
     */
    if (
        fps === 60 ||
        fps === 120
    ) {
        filters.push(
            `minterpolate=` +
            `fps=${fps}:` +
            `mi_mode=mci:` +
            `mc_mode=aobmc:` +
            `me_mode=bidir:` +
            `vsbmc=1`
        );
    }

    await runFFmpeg([
        '-i',
        input,

        '-vf',
        filters.join(','),

        '-c:v',
        'libx264',

        '-preset',
        'medium',

        '-crf',
        '18',

        '-pix_fmt',
        'yuv420p',

        '-c:a',
        'aac',

        '-b:a',
        '192k',

        '-movflags',
        '+faststart',

        output
    ]);
}

/* ============================================================
   PLUGINS
============================================================ */

module.exports = [

    /* ========================================================
       STICKER
    ======================================================== */

   

    /* ========================================================
       TO IMAGE
    ======================================================== */

    {
        name: 'toimg',
        description: 'Convert media to image',
        category: 'MEDIA',

        async execute({ reply }) {
            await reply(
                '🖼️ Reply to supported media with /toimg.'
            );
        }
    },

    /* ========================================================
       TO VIDEO
    ======================================================== */

    {
        name: 'tovideo',
        description: 'Convert media to video',
        category: 'MEDIA',

        async execute({ reply }) {
            await reply(
                '🎥 Reply to supported media with /tovideo.'
            );
        }
    },

    /* ========================================================
       URL
    ======================================================== */

    {
        name: 'tourl',
        alias: ['url'],
        description: 'Upload media and return URL',
        category: 'MEDIA',

        async execute({ reply }) {
            await reply(
                '🔗 Reply to an image/video/file with /tourl.\n\n' +
                'An upload provider must be configured for public URLs.'
            );
        }
    },

    /* ========================================================
       SCREENSHOT
    ======================================================== */

    {
        name: 'ss',
        alias: ['screenshot'],
        description: 'Take website screenshot',
        category: 'MEDIA',

        async execute({ reply, text }) {
            if (!text) {
                return reply(
                    '📸 Usage: /ss https://example.com'
                );
            }

            await reply(
                `📸 Screenshot requested:\n${text}\n\n` +
                'Screenshot API is not configured yet.'
            );
        }
    },

    /* ========================================================
       REMOVE BG
    ======================================================== */

    {
        name: 'removebg',
        description: 'Remove image background',
        category: 'MEDIA',

        async execute({ reply }) {
            await reply(
                '🪄 Reply to an image with /removebg.\n\n' +
                'A background-removal API is required for processing.'
            );
        }
    },

    /* ========================================================
       ENHANCE
    ======================================================== */

    {
        name: 'enhance',
        alias: [
            'upscale',
            'enh'
        ],
        description:
            'Enhance and upscale image or video',
        category: 'MEDIA',

        async execute(context) {

            const {
                reply,
                text,
                message,
                sendMedia
            } = context;

            const options =
                parseEnhanceOptions(text);

            let targetMessage =
                message;

            /*
             * If /enhance is used as a reply,
             * use the quoted media.
             */
            const quoted =
                getQuotedWAMessage(
                    message
                );

            if (quoted) {
                targetMessage =
                    quoted;
            }

            const media =
                detectMedia(
                    targetMessage
                );

            if (!media) {
                return reply(
                    '✨ *PRIME ENHANCE*\n\n' +
                    'Reply to an image or video with /enhance.\n\n' +
                    '*Examples:*\n' +
                    '/enhance\n' +
                    '/enhance 2k\n' +
                    '/enhance 4k\n' +
                    '/enhance 60\n' +
                    '/enhance 120\n' +
                    '/enhance 4k 60\n' +
                    '/enhance 4k 120'
                );
            }

            if (
                media.type === 'sticker'
            ) {
                return reply(
                    '❌ Please convert the sticker to an image/video first.'
                );
            }

            let inputFile = null;
            let outputFile = null;

            try {

                await reply(
                    '⏳ *PRIME ENHANCE STARTED*\n\n' +
                    `📐 Resolution: ${options.resolution.toUpperCase()}\n` +
                    (
                        media.type === 'video'
                            ? `🎞️ FPS: ${
                                options.fps ||
                                'Original'
                            }\n`
                            : ''
                    ) +
                    '\n🪄 Processing media...\n' +
                    'Please wait.'
                );

                /*
                 * sock.js provides this helper.
                 */
                if (
                    typeof context.downloadMedia !==
                    'function'
                ) {
                    throw new Error(
                        'downloadMedia() is missing from sock.js.'
                    );
                }

                const downloaded =
                    await context.downloadMedia(
                        targetMessage
                    );

                if (
                    !downloaded ||
                    !Buffer.isBuffer(
                        downloaded.buffer
                    )
                ) {
                    throw new Error(
                        'WhatsApp media could not be downloaded.'
                    );
                }

                inputFile =
                    makeTempFile(
                        media.type === 'video'
                            ? 'mp4'
                            : 'jpg'
                    );

                outputFile =
                    makeTempFile(
                        media.type === 'video'
                            ? 'mp4'
                            : 'jpg'
                    );

                fs.writeFileSync(
                    inputFile,
                    downloaded.buffer
                );

                /*
                 * IMAGE
                 */
                if (
                    media.type === 'image'
                ) {

                    await enhanceImage(
                        inputFile,
                        outputFile,
                        options.resolution
                    );

                    if (
                        typeof sendMedia !==
                        'function'
                    ) {
                        throw new Error(
                            'sendMedia() is missing from sock.js.'
                        );
                    }

                    await sendMedia({
                        image:
                            fs.readFileSync(
                                outputFile
                            ),

                        caption:
                            '✨ *PRIME ENHANCE*\n\n' +
                            `📐 Resolution: ${options.resolution.toUpperCase()}\n` +
                            '🪄 Enhanced image'
                    });

                    return;
                }

                /*
                 * VIDEO
                 */
                if (
                    media.type === 'video'
                ) {

                    await enhanceVideo(
                        inputFile,
                        outputFile,
                        options.resolution,
                        options.fps
                    );

                    if (
                        typeof sendMedia !==
                        'function'
                    ) {
                        throw new Error(
                            'sendMedia() is missing from sock.js.'
                        );
                    }

                    await sendMedia({
                        video:
                            fs.readFileSync(
                                outputFile
                            ),

                        mimetype:
                            'video/mp4',

                        caption:
                            '✨ *PRIME ENHANCE*\n\n' +
                            `📐 Resolution: ${options.resolution.toUpperCase()}\n` +
                            `🎞️ FPS: ${
                                options.fps ||
                                'Original'
                            }\n` +
                            '🪄 Enhanced video'
                    });

                    return;
                }

            } catch (error) {

                console.error(
                    '❌ Enhance error:',
                    error
                );

                await reply(
                    '❌ *ENHANCE FAILED*\n\n' +
                    `${error.message || error}\n\n` +
                    'Check the Prime Bot console for the exact error.'
                );

            } finally {

                cleanup(
                    inputFile,
                    outputFile
                );
            }
        }
    },

    /* ========================================================
       CAPTION
    ======================================================== */

    {
        name: 'caption',
        description: 'Add caption to media',
        category: 'MEDIA',

        async execute({ reply, text }) {

            if (!text) {
                return reply(
                    '✏️ Usage: /caption your caption'
                );
            }

            await reply(
                `✏️ Caption:\n${text}`
            );
        }
    }
];

