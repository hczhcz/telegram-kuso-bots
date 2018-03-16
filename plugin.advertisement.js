'use strict';

const fs = require('fs');

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    const fd = fs.openSync('log.advertisement', 'a');

    const ad = [];

    bot.onText(/^\/zao(@\w+)?(?: ([^\r\n]*))?$/, event((msg, match) => {
        const text = match[2]
            ? match[2].slice(0, config.advertisementMaxLength)
            : '起床了！';

        for (const i in ad) {
            if (ad[i].from.id === msg.from.id) {
                ad[i].text = text;

                return;
            }
        }

        const time = Date.now();

        const obj = {
            from: msg.from,
            time: time,
            text: text,
        };

        fs.write(fd, JSON.stringify(obj) + '\n', () => {
            // nothing
        });

        ad.push(obj);

        if (
            ad.length >= config.advertisementCount
            || ad.length && ad[0].time + 3 * 24 * 3600 * 1000 <= time
        ) {
            ad.shift();
        }
    }, 1));

    bot.onText(/^\/zaog[au]ys(@\w+)?(?: ([^\r\n]*))?$/, event((msg, match) => {
        let result = '';

        let lastDate = '';

        for (const i in ad) {
            const time = new Date(ad[i].time + 8 * 3600 * 1000);

            const newDate = (time.getUTCMonth() + 1) + '/' + time.getUTCDate();

            if (lastDate !== newDate) {
                lastDate = newDate;
                result += newDate + '\n';
            }

            result += (ad[i].from.username || ad[i].from.first_name) + ' '
                + time.getUTCHours() + ':' + time.getUTCMinutes() + ' '
                + ad[i].text + '\n';
        }

        if (result) {
            return bot.sendMessage(
                msg.chat.id,
                result,
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        }
    }, 1));
};
