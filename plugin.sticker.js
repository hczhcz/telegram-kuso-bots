'use strict';

const canvas = require('canvas');

module.exports = (bot, event, playerEvent, env) => {
    const stickerEvent = event((msg, match) => {
        bot.sendDocument(
            msg.chat.id,
            bot.getFileStream(msg.sticker.file_id),
            {},
            {
                filename: msg.sticker.file_id + '.webp',
            }
        );
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

                const image = canvas.createCanvas(512 * bgImage.width / size, 512 * bgImage.height / size);
                const ctx = image.getContext('2d');

                ctx.drawImage(bgImage, 0, 0, image.width, image.height);

                bot.sendDocument(
                    msg.chat.id,
                    image.toBuffer(),
                    {},
                    {
                        filename: file_id + '.png',
                    }
                );
            });
        });
    }, -1);

    bot.on('message', (msg) => {
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
