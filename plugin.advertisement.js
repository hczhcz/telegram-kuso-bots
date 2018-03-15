'use strict';

const fs = require('fs');

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    const fd = fs.openSync('log.advertisement', 'a');

    const ad = [];

    bot.onText(/^\/zao(@\w+)?(?: ([^\r\n]*))?$/, event((msg, match) => {
        if (match[2] && match[2].length <= config.advertisementMaxLength) {
            ad.filter((item, i, arr) => {
                return item.from.id !== msg.from.id;
            });

            const now = new Date();
            const localTime = new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60 * 1000);
            const time = localTime.getUTCHours() + ':' + localTime.getUTCMinutes();

            const obj = {
                from: msg.from,
                time: time,
                text: match[2],
            };

            fs.write(fd, JSON.stringify(obj) + '\n', () => {
                // nothing
            });

            ad.push(obj);

            if (ad.length >= config.advertisementCount) {
                ad.shift();
            }
        }
    }, 1));

    bot.onText(/^\/zaog[au]ys(@\w+)?(?: ([^\r\n]*))?$/, event((msg, match) => {
        let result = '';

        for (const i in ad) {
            result += (ad[i].from.username || ad[i].from.first_name) + ' '
                + ad[i].time + ' '
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
