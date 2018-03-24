'use strict';

const fs = require('fs');

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    const fd = fs.openSync('log.zao', 'a');

    const ad = [];

    bot.onText(/^\/zao(@\w+)?(?: ([^\r\n]*))?$/, event((msg, match) => {
        let text = '起床了！';

        if (match[2]) {
            text = match[2].slice(0, config.zaoMaxLength);
        } else {
            const chosen = env.command.tryGet(msg, 'zao', [], false);

            if (chosen) {
                if (chosen.text) {
                    text = chosen.text;
                } else {
                    // never reach
                    throw Error(JSON.stringify(chosen));
                }
            }
        }

        const time = Date.now();

        for (const i in ad) {
            if (ad[i].from.id === msg.from.id) {
                const cstNow = new Date(time + 8 * 3600 * 1000);
                const cstTime = new Date(ad[i].time + 8 * 3600 * 1000);

                if (
                    cstNow.getUTCFullYear() === cstTime.getUTCFullYear()
                    && cstNow.getUTCMonth() === cstTime.getUTCMonth()
                    && cstNow.getUTCDate() === cstTime.getUTCDate()
                ) {
                    ad[i].text = text;

                    return;
                }
            }
        }

        if (ad.length >= config.zaoCount) {
            ad.shift();
        }

        const obj = {
            from: msg.from,
            time: time,
            text: text,
        };

        ad.push(obj);

        fs.write(fd, JSON.stringify(obj) + '\n', () => {
            // nothing
        });
    }, -1));

    bot.onText(/^\/zaog[au]ys(@\w+)?(?: ([^\r\n]*))?$/, event((msg, match) => {
        let resultText = '';

        let lastDate = '';

        for (const i in ad) {
            const cstTime = new Date(ad[i].time + 8 * 3600 * 1000);
            const date = cstTime.getUTCMonth() + 1 + '/' + cstTime.getUTCDate();

            if (lastDate !== date) {
                lastDate = date;
                resultText += date + '\n';
            }

            resultText += (ad[i].from.username || ad[i].from.first_name) + ' '
                + cstTime.getUTCHours() + ':' + cstTime.getUTCMinutes() + '\n'
                + ad[i].text + '\n';
        }

        if (resultText) {
            return bot.sendMessage(
                msg.chat.id,
                resultText,
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        }
    }, -1));
};
