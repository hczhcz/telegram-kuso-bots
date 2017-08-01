'use strict';

module.exports = (bot, stats) => {
    return {
        stat: (msg, player) => {
            if (player) {
                return bot.sendMessage(
                    msg.chat.id,
                    '',
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            } else {
                return bot.sendMessage(
                    msg.chat.id,
                    '',
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            }
        },
    };
};
