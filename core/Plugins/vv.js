const {
    downloadMediaMessage
} = require('@whiskeysockets/baileys');

module.exports = {
    name: 'vv',
    alias: ['view', 'quoted'],
    description: 'Resend quoted normal media',
    category: 'MEDIA',

    async execute({ sock, message, jid, reply }) {
        try {
            if (!message) {
                return reply('❌ Message not found.');
            }

            const contextInfo =
                message.message?.extendedTextMessage?.contextInfo ||
                message.message?.imageMessage?.contextInfo ||
                message.message?.videoMessage?.contextInfo ||
                message.message?.documentMessage?.contextInfo ||
                message.message?.stickerMessage?.contextInfo;

            const quotedMessage = contextInfo?.quotedMessage;

            if (!quotedMessage) {
                return reply(
                    '👁️ *VV MEDIA VIEWER*\n\n' +
                    'Reply to a normal image, video, sticker, audio or document with:\n\n' +
                    '/vv'
                );
            }

            // Don't bypass View Once.
            if (
                quotedMessage.viewOnceMessage ||
                quotedMessage.viewOnceMessageV2 ||
                quotedMessage.viewOnceMessageV2Extension
            ) {
                return reply(
                    '🔒 *VIEW ONCE DETECTED*\n\n' +
                    'This is View Once media. I cannot bypass View Once protection.\n\n' +
                    'Use `/vv` with normal media instead.'
                );
            }

            let mediaType = null;
            let mediaMessage = null;

            if (quotedMessage.imageMessage) {
                mediaType = 'image';
                mediaMessage = quotedMessage.imageMessage;
            } else if (quotedMessage.videoMessage) {
                mediaType = 'video';
                mediaMessage = quotedMessage.videoMessage;
            } else if (quotedMessage.stickerMessage) {
                mediaType = 'sticker';
                mediaMessage = quotedMessage.stickerMessage;
            } else if (quotedMessage.audioMessage) {
                mediaType = 'audio';
                mediaMessage = quotedMessage.audioMessage;
            } else if (quotedMessage.documentMessage) {
                mediaType = 'document';
                mediaMessage = quotedMessage.documentMessage;
            }

            if (!mediaMessage) {
                return reply(
                    '❌ I could not detect supported media in that message.'
                );
            }

            await reply('⏳ Processing media...');

            /*
             * Reconstruct a proper WAMessage so Baileys'
             * downloadMediaMessage() can download it.
             */
            const quotedWAMessage = {
                key: {
                    remoteJid: jid,
                    fromMe: false,
                    id: contextInfo.stanzaId
                },
                message: quotedMessage
            };

            const buffer = await downloadMediaMessage(
                quotedWAMessage,
                'buffer',
                {},
                {
                    logger: sock.logger,
                    reuploadRequest: async msg => {
                        if (typeof sock.updateMediaMessage === 'function') {
                            return sock.updateMediaMessage(msg);
                        }
                        return undefined;
                    }
                }
            );

            if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
                throw new Error('Downloaded media is empty.');
            }

            if (mediaType === 'image') {
                await sock.sendMessage(
                    jid,
                    {
                        image: buffer,
                        caption: mediaMessage.caption || ''
                    },
                    {
                        quoted: message
                    }
                );
            }

            else if (mediaType === 'video') {
                await sock.sendMessage(
                    jid,
                    {
                        video: buffer,
                        caption: mediaMessage.caption || '',
                        mimetype: mediaMessage.mimetype || 'video/mp4'
                    },
                    {
                        quoted: message
                    }
                );
            }

            else if (mediaType === 'sticker') {
                await sock.sendMessage(
                    jid,
                    {
                        sticker: buffer
                    },
                    {
                        quoted: message
                    }
                );
            }

            else if (mediaType === 'audio') {
                await sock.sendMessage(
                    jid,
                    {
                        audio: buffer,
                        mimetype: mediaMessage.mimetype || 'audio/mp4',
                        ptt: !!mediaMessage.ptt
                    },
                    {
                        quoted: message
                    }
                );
            }

            else if (mediaType === 'document') {
                await sock.sendMessage(
                    jid,
                    {
                        document: buffer,
                        mimetype:
                            mediaMessage.mimetype ||
                            'application/octet-stream',
                        fileName:
                            mediaMessage.fileName ||
                            'file'
                    },
                    {
                        quoted: message
                    }
                );
            }

        } catch (error) {
            console.error('❌ /vv error:', error);

            await reply(
                '❌ *VV ERROR*\n\n' +
                `${error.message || error}`
            );
        }
    }
};