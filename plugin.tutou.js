'use strict';

const canvas = require('canvas');

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    let tutouImage = null;

    // cache image
    canvas.loadImage('tutou/' + config.tutouImage).then((image) => {
        tutouImage = image;
    });

    bot.onText(/^\/addtutou(@\w+)?(?: ([\d.]+) ([\d.]+) ([\d.]+))?$/, event((msg, match) => {
        if (msg.reply_to_message) {
            let file_id = null;

            // TODO: webp is not supported
            // if (msg.reply_to_message.sticker) {
            //     file_id = msg.reply_to_message.sticker.file_id;
            // }

            if (msg.reply_to_message.photo) {
                let best_width = 0;

                for (const i in msg.reply_to_message.photo) {
                    if (best_width < msg.reply_to_message.photo[i].width) {
                        best_width = msg.reply_to_message.photo[i].width;
                        file_id = msg.reply_to_message.photo[i].file_id;
                    }
                }
            }

            if (file_id) {
                bot.getFile(file_id).then((file) => {
                    const url = 'https://api.telegram.org/file/bot' + config.threesomeToken + '/' + file.file_path;

                    canvas.loadImage(url).then((bgImage) => {
                        const image = canvas.createCanvas(bgImage.width, bgImage.height);
                        const ctx = image.getContext('2d');

                        const size = Math.min(bgImage.width, bgImage.height) * (
                            match[4]
                                ? Math.min(parseFloat(match[4]), 1)
                                : 0.1 + 0.8 * Math.random()
                        );
                        const left = bgImage.width * (
                            match[2]
                                ? Math.min(parseFloat(match[2]), 1)
                                : Math.random()
                        ) - 0.5 * size;
                        const top = bgImage.height * (
                            match[3]
                                ? Math.min(parseFloat(match[3]), 1)
                                : Math.random()
                        ) - 0.5 * size;

                        ctx.drawImage(bgImage, 0, 0);
                        ctx.drawImage(tutouImage, left, top, size, size);

                        bot.sendPhoto(
                            msg.chat.id,
                            image.toBuffer(),
                            {
                                reply_to_message_id: msg.message_id,
                            }
                        );
                    });
                });
            }
        }
    }));

    env.info.addPluginHelp(
        'tutou',
        '/addtutou 给图片加上兔头\n'
            + '/addtutou <left> <top> <size> 给图片指定位置加上兔头'
    );
};
