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

        const obj = {
            from: msg.from,
            time: Date.now(),
            text: text,
        };

        fs.write(fd, JSON.stringify(obj) + '\n', () => {
            // nothing
        });

        ad.push(obj);

        if (ad.length >= config.advertisementCount) {
            ad.shift();
        }
    }, 1));

    bot.onText(/^\/zaog[au]ys(@\w+)?(?: ([^\r\n]*))?$/, event((msg, match) => {
        let result = '';

        for (const i in ad) {
            const time = ad[i].time + 8 * 60 * 60 * 1000;

            result += (ad[i].from.username || ad[i].from.first_name) + ' '
                + time.getUTCHours() + ':' + time.getUTCMinutes() + ' '
                + ad[i].text + '\n';
        }

        return bot.sendMessage(
            msg.chat.id,
            result,
            {
                reply_to_message_id: msg.message_id,
            }
        );
    }, 1));
};
