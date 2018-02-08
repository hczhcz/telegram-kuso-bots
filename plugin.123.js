'use strict';

module.exports = (bot) => {
    const actions = {};

    bot.on('message', (msg) => {
        if (actions[msg.chat.id]) {
            const action = actions[msg.chat.id];

            delete actions[msg.chat.id];

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
            }

            match = msg.text.match(/123不许(.+)/);
            if (match) {
                actions[msg.chat.id] = '你' + match[1] + '了！';
            }
        }
    });
};
