
'use strict';

const fs = require('fs');
const path = require('path');

const {
    Sticker,
    StickerTypes
} = require('wa-sticker-formatter');

/*
|--------------------------------------------------------------------------
| PRIME BOT - STICKER SYSTEM
|--------------------------------------------------------------------------
|
| Commands:
|
| /sticker
| /sticker me
| /sticker update
| /sticker update me
| /mysticker
| /sticker delete
|
|--------------------------------------------------------------------------
*/

const DATA_DIR = path.join(process.cwd(), 'data');
const STICKER_FILE = path.join(DATA_DIR, 'user-stickers.json');

function ensureStorage() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, {
            recursive: true
        });
    }

    if (!fs.existsSync(STICKER_FILE)) {
        fs.writeFileSync(
            STICKER_FILE,
            JSON.stringify({}, null, 2)
        );
    }
}

function loadStickers() {
    ensureStorage();

    try {
        const data = fs.readFileSync(
            STICKER_FILE,
            'utf8'
        );

        return JSON.parse(data || '{}');

    } catch (error) {
        console.error(
            '❌ Failed to load user stickers:',
            error
        );

        return {};
    }
}

function saveStickers(data) {
    ensureStorage();

    fs.writeFileSync(
        STICKER_FILE,
        JSON.stringify(data, null, 2)
    );
}

/*
|--------------------------------------------------------------------------
| USER ID
|--------------------------------------------------------------------------
*/

function getUserId(context) {
    const {
        message,
        jid
    } = context;

    return (
        message?.key?.participant ||
        message?.key?.participantAlt ||
        message?.key?.senderPn ||
        message?.key?.senderLid ||
        message?.key?.remoteJid ||
        jid
    );
}

/*
|--------------------------------------------------------------------------
| PROFILE PICTURE
|--------------------------------------------------------------------------
*/

async function getProfileSticker(
    sock,
    targetJid
) {
    const profileUrl =
        await sock.profilePictureUrl(
            targetJid,
            'image'
        );

    if (!profileUrl) {
        throw new Error(
            'No profile picture was found.'
        );
    }

    const response =
        await fetch(profileUrl);

    if (!response.ok) {
        throw new Error(
            `Profile picture request failed: ${response.status}`
        );
    }

    const arrayBuffer =
        await response.arrayBuffer();

    const imageBuffer =
        Buffer.from(arrayBuffer);

    const sticker =
        new Sticker(
            imageBuffer,
            {
                pack: 'PRIME BOT',
                author: 'PRIME BOT',
                type: StickerTypes.FULL,
                quality: 90
            }
        );

    return await sticker.toBuffer();
}

/*
|--------------------------------------------------------------------------
| SAVE USER STICKER
|--------------------------------------------------------------------------
*/

function saveUserSticker(
    userId,
    stickerBuffer
) {
    const stickers =
        loadStickers();

    stickers[userId] = {
        sticker:
            stickerBuffer.toString('base64'),

        updatedAt:
            new Date().toISOString()
    };

    saveStickers(stickers);
}

/*
|--------------------------------------------------------------------------
| GET USER STICKER
|--------------------------------------------------------------------------
*/

function getUserSticker(
    userId
) {
    const stickers =
        loadStickers();

    const saved =
        stickers[userId];

    if (!saved?.sticker) {
        return null;
    }

    return Buffer.from(
        saved.sticker,
        'base64'
    );
}

/*
|--------------------------------------------------------------------------
| DELETE USER STICKER
|--------------------------------------------------------------------------
*/

function deleteUserSticker(
    userId
) {
    const stickers =
        loadStickers();

    if (!stickers[userId]) {
        return false;
    }

    delete stickers[userId];

    saveStickers(stickers);

    return true;
}

/*
|--------------------------------------------------------------------------
| COMMAND
|--------------------------------------------------------------------------
*/

module.exports = {

    name: 'sticker',

    alias: [
        's',
        'stiker',
        'mysticker'
    ],

    description:
        'Create, save and manage personal stickers',

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

        const userId =
            getUserId(context);

        try {

            /*
            |--------------------------------------------------------------------------
            | ARGUMENTS
            |--------------------------------------------------------------------------
            */

            const command =
                String(
                    args?.[0] || ''
                ).toLowerCase();

            const secondArg =
                String(
                    args?.[1] || ''
                ).toLowerCase();


            /*
            |--------------------------------------------------------------------------
            | /MYSTICKER
            |--------------------------------------------------------------------------
            |
            | Send user's saved sticker.
            |
            */

            if (
                command === 'mysticker' ||
                context.command === 'mysticker'
            ) {

                const savedSticker =
                    getUserSticker(userId);

                if (!savedSticker) {
                    return reply(
                        '❌ *NO SAVED STICKER*\n\n' +
                        'You do not have a saved personal sticker yet.\n\n' +
                        'Reply to an image with:\n' +
                        '`/sticker update`'
                    );
                }

                await sock.sendMessage(
                    jid,
                    {
                        sticker:
                            savedSticker
                    },
                    {
                        quoted:
                            message
                    }
                );

                return;
            }


            /*
            |--------------------------------------------------------------------------
            | /STICKER DELETE
            |--------------------------------------------------------------------------
            */

            if (
                command === 'delete' ||
                command === 'remove'
            ) {

                const deleted =
                    deleteUserSticker(
                        userId
                    );

                if (!deleted) {
                    return reply(
                        '❌ You do not have a saved sticker.'
                    );
                }

                return reply(
                    '✅ *PERSONAL STICKER DELETED*\n\n' +
                    'Your saved PRIME sticker has been removed.'
                );
            }


            /*
            |--------------------------------------------------------------------------
            | /STICKER UPDATE ME
            |--------------------------------------------------------------------------
            |
            | Update saved sticker using profile picture.
            |
            */

            if (
                command === 'update' &&
                secondArg === 'me'
            ) {

                await reply(
                    '⏳ *Updating your personal sticker...*'
                );

                const stickerBuffer =
                    await getProfileSticker(
                        sock,
                        userId
                    );

                if (
                    !Buffer.isBuffer(
                        stickerBuffer
                    ) ||
                    stickerBuffer.length === 0
                ) {
                    throw new Error(
                        'Profile sticker conversion failed.'
                    );
                }

                saveUserSticker(
                    userId,
                    stickerBuffer
                );

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

                return reply(
                    '✅ *PERSONAL STICKER UPDATED*\n\n' +
                    'Your saved sticker has been replaced with your current profile picture.'
                );
            }


            /*
            |--------------------------------------------------------------------------
            | DIRECT MEDIA
            |--------------------------------------------------------------------------
            */

            let mediaBuffer =
                null;

            let mediaType =
                null;


            /*
            |--------------------------------------------------------------------------
            | DIRECT IMAGE / VIDEO
            |--------------------------------------------------------------------------
            */

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
            | QUOTED IMAGE / VIDEO
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
            | /STICKER UPDATE
            |--------------------------------------------------------------------------
            |
            | Reply to an image/video:
            |
            | /sticker update
            |
            */

            if (
                command === 'update'
            ) {

                if (!mediaBuffer) {

                    return reply(
                        '╭━━━〔 🔄 UPDATE STICKER 〕━━━╮\n' +
                        '┃\n' +
                        '┃ Reply to an image or video\n' +
                        '┃ with:\n' +
                        '┃\n' +
                        '┃ /sticker update\n' +
                        '┃\n' +
                        '┃ Or use your profile picture:\n' +
                        '┃\n' +
                        '┃ /sticker update me\n' +
                        '┃\n' +
                        '╰━━━━━━━━━━━━━━━━━━━━━━━━╯'
                    );
                }

                if (
                    !Buffer.isBuffer(
                        mediaBuffer
                    ) ||
                    mediaBuffer.length === 0
                ) {
                    return reply(
                        '❌ The media could not be downloaded.'
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | VIDEO SAFETY
                |--------------------------------------------------------------------------
                */

                if (
                    mediaType === 'video' &&
                    mediaBuffer.length >
                    15 * 1024 * 1024
                ) {

                    return reply(
                        '❌ That video is too large.\n\n' +
                        'Try a smaller or shorter video.'
                    );
                }

                await reply(
                    '⏳ *Updating your personal PRIME sticker...*'
                );

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
                | SAVE NEW STICKER
                |--------------------------------------------------------------------------
                */

                saveUserSticker(
                    userId,
                    stickerBuffer
                );

                /*
                |--------------------------------------------------------------------------
                | SEND NEW STICKER
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

                return reply(
                    '✅ *PERSONAL STICKER UPDATED*\n\n' +
                    'Your new sticker has been saved.\n\n' +
                    'Use `/mysticker` anytime to send it again.'
                );
            }


            /*
            |--------------------------------------------------------------------------
            | /STICKER ME
            |--------------------------------------------------------------------------
            |
            | Creates sticker from profile picture.
            |
            */

            if (
                command === 'me'
            ) {

                try {

                    const stickerBuffer =
                        await getProfileSticker(
                            sock,
                            userId
                        );

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
                        'I could not turn your profile picture into a sticker.\n\n' +
                        'Try replying to an image with:\n' +
                        '/sticker update'
                    );
                }
            }


            /*
            |--------------------------------------------------------------------------
            | NO MEDIA
            |--------------------------------------------------------------------------
            */

            if (!mediaBuffer) {

                return reply(
                    '╭━━━〔 🖼️ PRIME STICKER 〕━━━╮\n' +
                    '┃\n' +
                    '┃ Reply to an image/video:\n' +
                    '┃ /sticker\n' +
                    '┃\n' +
                    '┃ Save/update your sticker:\n' +
                    '┃ /sticker update\n' +
                    '┃\n' +
                    '┃ Profile picture:\n' +
                    '┃ /sticker me\n' +
                    '┃ /sticker update me\n' +
                    '┃\n' +
                    '┃ Send saved sticker:\n' +
                    '┃ /mysticker\n' +
                    '┃\n' +
                    '┃ Delete saved sticker:\n' +
                    '┃ /sticker delete\n' +
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
            | VIDEO SIZE
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


            /*
            |--------------------------------------------------------------------------
            | CREATE NORMAL STICKER
            |--------------------------------------------------------------------------
            */

            await reply(
                '⏳ *Creating PRIME sticker...*'
            );

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

