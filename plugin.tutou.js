'use strict';

const canvas = require('canvas');
const cwebp = require('cwebp');

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    const tutouImages = {};

    for (const i in config.tutouImages) {
        // cache image
        canvas.loadImage('tutou/' + config.tutouImages[i]).then((image) => {
            tutouImages[i] = image;
        });
    }

    const draw = (msg, match, tutouImage) => {
        if (msg.reply_to_message) {
            const render = (bgImage) => {
                const image = canvas.createCanvas(bgImage.width, bgImage.height);
                const ctx = image.getContext('2d');

                ctx.drawImage(bgImage, 0, 0);

                const left = bgImage.width * (
                    match[2]
                        ? Math.min(Math.max(parseFloat(match[2]), -7), 8)
                        : Math.asin(Math.random() * 2 - 1) / Math.PI + 0.5
                );
                const top = bgImage.height * (
                    match[3]
                        ? Math.min(Math.max(parseFloat(match[3]), -7), 8)
                        : Math.asin(Math.random() * 2 - 1) / Math.PI + 0.5
                );
                const size = Math.min(bgImage.width, bgImage.height) * (
                    match[5]
                        ? Math.min(Math.max(parseFloat(match[5]), 0), 10)
                        : Math.random() * 0.8 + 0.1
                );
                const angle = match[6]
                    ? Math.min(Math.max(parseFloat(match[6]), -360), 360) * Math.PI / 180
                    : Math.asin(Math.random() * 2 - 1) * 2;

                ctx.translate(left, top);
                ctx.rotate(angle);

                if (match[4] || match[4] !== '' && Math.random() < 0.5) {
                    ctx.scale(-1, 1);
                }

                ctx.drawImage(tutouImage, -size / 2, -size / 2, size, size);

                return image;
            };

            if (msg.reply_to_message.sticker) {
                const decoder = new cwebp.DWebp(bot.getFileStream(msg.reply_to_message.sticker.file_id));

                decoder.toBuffer((decodeErr, decodeBuffer) => {
                    canvas.loadImage(decodeBuffer).then((bgImage) => {
                        const encoder = new cwebp.CWebp(render(bgImage).createPNGStream());

                        encoder.toBuffer((encodeErr, encodeBuffer) => {
                            bot.sendSticker(
                                msg.chat.id,
                                encodeBuffer,
                                {
                                    reply_to_message_id: msg.message_id,
                                }
                            );
                        });
                    });
                });
            }

            if (msg.reply_to_message.photo) {
                let best_width = 0;
                let file_id = null;

                for (const i in msg.reply_to_message.photo) {
                    if (best_width < msg.reply_to_message.photo[i].width) {
                        best_width = msg.reply_to_message.photo[i].width;
                        file_id = msg.reply_to_message.photo[i].file_id;
                    }
                }

                bot.getFileLink(file_id).then((link) => {
                    canvas.loadImage(link).then((bgImage) => {
                        bot.sendPhoto(
                            msg.chat.id,
                            render(bgImage).toBuffer(),
                            {
                                reply_to_message_id: msg.message_id,
                            }
                        );
                    });
                });
            }
        }
    };

    bot.onText(/^\/addtutou(@\w+)?(?: (-?[\d.]+) (-?[\d.]+))?(?: (-?)([\d.]+))?(?: (-?[\d.]+))?$/, event((msg, match) => {
        draw(msg, match, tutouImages.tutou);
    }, 1));

    bot.onText(/^\/addkangaroo(@\w+)?(?: (-?[\d.]+) (-?[\d.]+))?(?: (-?)([\d.]+))?(?: (-?[\d.]+))?$/, event((msg, match) => {
        draw(msg, match, tutouImages.kangaroo);
    }, 1));

    env.info.addPluginHelp(
        'tutou',
        '/addtutou 给图片加上兔头\n'
            + '/addtutou <left> <top> 指定位置画兔头\n'
            + '/addtutou <left> <top> <size> 指定位置和尺寸画兔头\n'
            + '/addtutou <left> <top> <size> <angle> 指定位置、尺寸、角度画兔头\n'
            + '/addkangaroo 给图片加上袋鼠头\n'
            + '/addkangaroo <left> <top> 指定位置画袋鼠头\n'
            + '/addkangaroo <left> <top> <size> 指定位置和尺寸画袋鼠头\n'
            + '/addkangaroo <left> <top> <size> <angle> 指定位置、尺寸、角度画袋鼠头'
    );
};
