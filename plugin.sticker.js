'use strict';

const canvas = require('canvas');
const cwebp = require('cwebp');

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    const stickerEvent = event((msg, match) => {
        if (msg.sticker.is_animated) {
            bot.sendDocument(
                msg.chat.id,
                bot.getFileStream(msg.sticker.file_id),
                {},
                {
                    filename: msg.sticker.file_id + '.gz',
                    contentType: 'application/gzip',
                }
            );
        } else if (msg.sticker.is_video) {
            bot.sendDocument(
                msg.chat.id,
                bot.getFileStream(msg.sticker.file_id),
                {},
                {
                    filename: msg.sticker.file_id + '.webm',
                    contentType: 'video/webm',
                }
            );
        } else {
            const decoder = new cwebp.DWebp(bot.getFileStream(msg.sticker.file_id));

            decoder.toBuffer((err, buffer) => {
                bot.sendDocument(
                    msg.chat.id,
                    buffer,
                    {},
                    {
                        filename: msg.sticker.file_id + '.png',
                        contentType: 'image/png',
                    }
                );
            });
        }
    }, -1);

    const animationEvent = event((msg, match) => {
        bot.sendDocument(
            msg.chat.id,
            bot.getFileStream(msg.animation.file_id),
            {},
            {
                filename: msg.animation.file_id + '.m4v',
                contentType: 'video/mp4',
            }
        );
    }, -1);

    const imageEvent = event((msg, match) => {
        let bestWidth = 0;
        let fileId = msg.document && msg.document.file_id;

        for (const i in msg.photo) {
            if (bestWidth < msg.photo[i].width) {
                bestWidth = msg.photo[i].width;
                fileId = msg.photo[i].file_id;
            }
        }

        bot.getFileLink(fileId).then((link) => {
            canvas.loadImage(link).then((bgImage) => {
                const size = Math.max(bgImage.width, bgImage.height);

                const image = canvas.createCanvas(bgImage.width * 512 / size, bgImage.height * 512 / size);
                const ctx = image.getContext('2d');

                ctx.drawImage(bgImage, 0, 0, image.width, image.height);

                bot.sendDocument(
                    msg.chat.id,
                    image.toBuffer(),
                    {},
                    {
                        filename: fileId + '.png',
                        contentType: 'image/png',
                    }
                );
            });
        });
    }, -1);

    bot.on('message', (msg) => {
        if (config.ban[msg.from.id]) {
            return;
        }

        if (msg.chat.id === msg.from.id && msg.sticker) {
            stickerEvent(msg, []);
        }

        if (msg.chat.id === msg.from.id && msg.animation) {
            animationEvent(msg, []);
        }

        if (msg.chat.id === msg.from.id && (msg.document || msg.photo)) {
            imageEvent(msg, []);
        }
    });

    env.info.addPluginHelp(
        'sticker',
        '<sticker> （私聊）获取表情文件\n'
            + '<image> （私聊）转换为表情文件'
    );
};
