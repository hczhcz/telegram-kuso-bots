'use strict';

const canvas = require('canvas');

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    let tutouImage = null;

    // cache image
    canvas.loadImage('tutou/' + config.tutouImage).then((image) => {
        tutouImage = image;
    });

    bot.onText(/^\/addtutou(@\w+)?(?: (-?[\d.]+) (-?[\d.]+))?(?: (-?[\d.]+))?(?: (-?\d+))?$/, event((msg, match) => {
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
                bot.getFileLink(file_id).then((link) => {
                    canvas.loadImage(link).then((bgImage) => {
                        const image = canvas.createCanvas(bgImage.width, bgImage.height);
                        const ctx = image.getContext('2d');

                        ctx.drawImage(bgImage, 0, 0);

                        const left = bgImage.width * (
                            match[2]
                                ? Math.min(Math.max(parseFloat(match[2]), -1), 2)
                                : Math.random()
                        );
                        const top = bgImage.height * (
                            match[3]
                                ? Math.min(Math.max(parseFloat(match[3]), -1), 2)
                                : Math.random()
                        );
                        const size = Math.min(bgImage.width, bgImage.height) * (
                            match[4]
                                ? Math.min(Math.max(parseFloat(match[4]), 0), 2)
                                : 0.1 + 0.8 * Math.random()
                        );
                        const angle = Math.PI / 180 * (
                            match[5]
                                ? Math.min(Math.max(parseInt(match[5], 10), -360), 360)
                                : 360 * Math.random() - 180
                        );

                        ctx.translate(left, top);
                        ctx.rotate(angle);
                        ctx.drawImage(tutouImage, -0.5 * size, -0.5 * size, size, size);

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
            + '/addtutou <left> <top> 指定位置画兔头\n'
            + '/addtutou <left> <top> <size> 指定位置和尺寸画兔头'
            + '/addtutou <left> <top> <size> <angle> 指定位置、尺寸、角度画兔头'
    );
};
