'use strict';

const fs = require('fs');

module.exports = (bot) => {
    const fd = fs.openSync('log.123', 'a');

    const actions = {};

    bot.on('message', (msg) => {
        if (actions[msg.chat.id]) {
            const action = actions[msg.chat.id];

            delete actions[msg.chat.id];

            fs.write(fd, JSON.stringify({
                msg: msg,
                action: action,
            }) + '\n', () => {
                // nothing
            });

            return bot.sendMessage(
                msg.chat.id,
                action,
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        } else if (msg.text) {
            let match = null;

            match = msg.text.match(/123(.*人)/);
            if (match) {
                actions[msg.chat.id] = '你是假的' + match[1] + '！';

                fs.write(fd, JSON.stringify({
                    msg: msg,
                }) + '\n', () => {
                    // nothing
                });
            }

            match = msg.text.match(/123不许(.+)/);
            if (match) {
                actions[msg.chat.id] = '你' + match[1] + '了！';

                fs.write(fd, JSON.stringify({
                    msg: msg,
                }) + '\n', () => {
                    // nothing
                });
            }
        }
    });
};
