'use strict';

const canvas = require('canvas');
const cwebp = require('cwebp');

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    const stickerEvent = event((msg, match) => {
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
    }, -1);

    const photoEvent = event((msg, match) => {
        let best_width = 0;
        let file_id = null;

        for (const i in msg.photo) {
            if (best_width < msg.photo[i].width) {
                best_width = msg.photo[i].width;
                file_id = msg.photo[i].file_id;
            }
        }

        bot.getFileLink(file_id).then((link) => {
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
                        filename: file_id + '.png',
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

        if (msg.chat.id === msg.from.id && msg.photo) {
            photoEvent(msg, []);
        }
    });

    env.info.addPluginHelp(
        'sticker',
        '<sticker> （私聊）获取表情文件\n'
            + '<photo> （私聊）转换为表情文件'
    );
};
