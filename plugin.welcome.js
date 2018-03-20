'use strict';

module.exports = (bot, event, playerEvent, env) => {
    bot.on('message', (msg) => {
        if (msg.new_chat_member) {
            bot.sendMessage(
                msg.chat.id,
                '让我们祝福这对新人！',
                {
                    parse_mode: 'HTML',
                }
            );
        }
    });
};
