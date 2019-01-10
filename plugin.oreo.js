'use strict';

const canvas = require('canvas');

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    const images = {};

    // cache images
    for (const i in config.oreoImageMap) {
        const item = config.oreoImageMap[i];

        if (item.front) {
            canvas.loadImage('oreo/' + item.front).then((image) => {
                images[item.front] = image;
            });
        }

        if (item.back) {
            canvas.loadImage('oreo/' + item.back).then((image) => {
                images[item.back] = image;
            });
        }
    }

    bot.onText(/^\/((?:o|re|and)+)(@\w+)?$/, event((msg, match) => {
        const items = [];
        let offset = 0;
        let width = 0;
        let height = 0;

        for (let i = 0; i < match[1].length;) {
            const head = match[1].slice(i);
            let done = false;

            for (const j in config.oreoImageMap) {
                if (head.startsWith(j)) {
                    const item = config.oreoImageMap[j];

                    if (items.length) {
                        items.push([item.back, offset, item.width, item.height]);
                    } else {
                        items.push([item.front, offset, item.width, item.height]);
                    }

                    offset += item.delta;
                    width = Math.max(width, item.width);
                    height = Math.max(height, offset + item.height);

                    i += j.length;
                    done = true;

                    break;
                }
            }

            if (!done) {
                throw Error(JSON.stringify(match[1]));
            }
        }

        const image = canvas.createCanvas(width, height);
        const ctx = image.getContext('2d');

        items.reverse();

        for (const i in items) {
            if (items[i][0]) {
                ctx.drawImage(
                    images[items[i][0]],
                    (width - items[i][2]) / 2,
                    items[i][1],
                    items[i][2],
                    items[i][3]
                );
            }
        }

        bot.sendPhoto(
            msg.chat.id,
            image.toBuffer(),
            {
                reply_to_message_id: msg.message_id,
            }
        );
    }, 2));
};
