'use strict';

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    const ad = [];

    bot.onText(/^\/ad(@\w+)?(?: ([^\r\n]*))?$/, event((msg, match) => {
        if (match[2] && match[2].length <= config.advertisementMaxLength) {
            for (const i in ad) {
                if (ad[i].from.id === msg.from.id) {
                    ad.splice(i, 1);
                }
            }

            ad.unshift({
                from: msg.from,
                text: match[2],
            });

            ad.splice(config.advertisementCount);
        }

        let result = '';

        for (const i in ad) {
            result += (ad[i].from.username || ad[i].from.first_name) + ': '
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
