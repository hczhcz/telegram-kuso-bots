'use strict';

const util = require('util');

module.exports = (bot, event, playerEvent, env) => {
    bot.onText(/^\/info(@\w+)?$/, event((msg, match) => {
        bot.sendMessage(
            msg.chat.id,
            util.inspect(msg),
            {
                reply_to_message_id: msg.message_id,
            }
        );
    }, 1));
};
