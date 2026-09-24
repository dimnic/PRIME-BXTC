'use strict';

const {
    Sticker,
    StickerTypes
} = require('wa-sticker-formatter');

module.exports = {
    name: 'sticker',

    alias: [
        's',
        'stiker'
    ],

    description:
        'Convert an image or video into a sticker',

    category:
        'MEDIA',

    async execute(context) {
        const {
            sock,
            message,
            jid,
            reply,
            args,
            downloadQuotedMedia,
            downloadMedia
        } = context;

        try {
            /*
            |--------------------------------------------------------------------------
            | STICKER FROM "ME"
            |--------------------------------------------------------------------------
            */

            if (
                args?.[0]?.toLowerCase() === 'me'
            ) {
                try {
                    const targetJid =
                        message?.key?.participant ||
                        message?.key?.remoteJid ||
                        jid;

                    const profileUrl =
                        await sock.profilePictureUrl(
                            targetJid,
                            'image'
                        );

                    if (!profileUrl) {
                        return reply(
                            '❌ No profile picture was found.'
                        );
                    }

                    const response =
                        await fetch(
                            profileUrl
                        );

                    if (!response.ok) {
                        throw new Error(
                            `Profile picture request failed: ${response.status}`
                        );
                    }

                    const arrayBuffer =
                        await response.arrayBuffer();

                    const imageBuffer =
                        Buffer.from(
                            arrayBuffer
                        );

                    const sticker =
                        new Sticker(
                            imageBuffer,
                            {
                                pack:
                                    '',

                                author:
                                    '',

                                type:
                                    StickerTypes.FULL,

                                quality:
                                    90
                            }
                        );

                    const stickerBuffer =
                        await sticker.toBuffer();

                    if (
                        !Buffer.isBuffer(
                            stickerBuffer
                        ) ||
                        !stickerBuffer.length
                    ) {
                        throw new Error(
                            'Sticker conversion returned an empty buffer.'
                        );
                    }

                    await sock.sendMessage(
                        jid,
                        {
                            sticker:
                                stickerBuffer
                        },
                        {
                            quoted:
                                message
                        }
                    );

                    console.log(
                        '✅ /sticker me sent'
                    );

                    return;

                } catch (error) {

                    console.error(
                        '❌ /sticker me error:',
                        error
                    );

                    return reply(
                        '❌ *PROFILE STICKER FAILED*\n\n' +
                        'I could not turn the profile picture into a sticker.\n\n' +
                        'Try replying to an image with:\n' +
                        '/sticker'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | DIRECT MEDIA
            |--------------------------------------------------------------------------
            |
            | This allows:
            |
            |   Send image + /sticker
            |
            | when WhatsApp includes the image directly with the command.
            */

            let mediaBuffer =
                null;

            let mediaType =
                null;

            if (
                typeof downloadMedia ===
                'function'
            ) {
                const directType =
                    context.getMediaType?.(
                        message
                    );

                if (
                    directType === 'image' ||
                    directType === 'video'
                ) {
                    mediaBuffer =
                        await downloadMedia(
                            message
                        );

                    mediaType =
                        directType;
                }
            }

            /*
            |--------------------------------------------------------------------------
            | QUOTED MEDIA
            |--------------------------------------------------------------------------
            */

            if (
                !mediaBuffer &&
                typeof downloadQuotedMedia ===
                'function'
            ) {
                const quotedType =
                    context.getMediaType?.(
                        context.quoted
                    );

                if (
                    quotedType === 'image' ||
                    quotedType === 'video'
                ) {
                    mediaBuffer =
                        await downloadQuotedMedia();

                    mediaType =
                        quotedType;
                }
            }

            /*
            |--------------------------------------------------------------------------
            | NO MEDIA
            |--------------------------------------------------------------------------
            */

            if (
                !mediaBuffer
            ) {
                return reply(
                    '╭━━━〔 🖼️ PRIME STICKER 〕━━━╮\n' +
                    '┃\n' +
                    '┃ Reply to an *image* or *video*\n' +
                    '┃ with:\n' +
                    '┃\n' +
                    '┃   /sticker\n' +
                    '┃\n' +
                    '┃ Or create a sticker from\n' +
                    '┃ your profile picture:\n' +
                    '┃\n' +
                    '┃   /sticker me\n' +
                    '┃\n' +
                    '╰━━━━━━━━━━━━━━━━━━━━━━━━╯'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | VALIDATE MEDIA
            |--------------------------------------------------------------------------
            */

            if (
                !Buffer.isBuffer(
                    mediaBuffer
                ) ||
                mediaBuffer.length === 0
            ) {
                return reply(
                    '❌ The media could not be downloaded.\n\n' +
                    'Please try again with a normal image or short video.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | VIDEO SIZE / DURATION SAFETY
            |--------------------------------------------------------------------------
            */

            if (
                mediaType === 'video' &&
                mediaBuffer.length >
                15 * 1024 * 1024
            ) {
                return reply(
                    '❌ That video is too large for sticker conversion.\n\n' +
                    'Try a shorter/smaller video.'
                );
            }

            await reply(
                '⏳ *Creating PRIME sticker...*'
            );

            /*
            |--------------------------------------------------------------------------
            | BUILD STICKER
            |--------------------------------------------------------------------------
            */

            const sticker =
                new Sticker(
                    mediaBuffer,
                    {
                        pack:
                            'PRIME BOT',

                        author:
                            'PRIME BOT',

                        type:
                            mediaType === 'image'
                                ? StickerTypes.FULL
                                : StickerTypes.DEFAULT,

                        quality:
                            85
                    }
                );

            const stickerBuffer =
                await sticker.toBuffer();

            if (
                !Buffer.isBuffer(
                    stickerBuffer
                ) ||
                stickerBuffer.length === 0
            ) {
                throw new Error(
                    'Sticker conversion produced an empty buffer.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | SEND STICKER
            |--------------------------------------------------------------------------
            */

            await sock.sendMessage(
                jid,
                {
                    sticker:
                        stickerBuffer
                },
                {
                    quoted:
                        message
                }
            );

            console.log(
                `✅ /sticker ${mediaType || 'media'} sent`
            );

        } catch (error) {

            console.error(
                '❌ /sticker error:',
                error
            );

            try {
                await reply(
                    '❌ *STICKER FAILED*\n\n' +
                    `${error.message || error}\n\n` +
                    'Try replying to a normal image with:\n' +
                    '/sticker'
                );
            } catch (_) {}
        }
    }
};