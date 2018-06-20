'use strict';

module.exports = (bot, event, playerEvent, env) => {
    const pairs = {};

    bot.on('message', (msg) => {
        if (msg.new_chat_members) {
            for (const i in msg.new_chat_members) {
                const name1 = msg.new_chat_members[i].username
                    || msg.new_chat_members[i].first_name;

                if (pairs[msg.chat.id]) {
                    const name2 = pairs[msg.chat.id];

                    delete pairs[msg.chat.id];

                    bot.sendMessage(
                        msg.chat.id,
                        '让我们祝福这对新人！\n'
                            + name2 + ' ' + name1,
                        {
                            parse_mode: 'HTML',
                        }
                    );
                } else {
                    pairs[msg.chat.id] = name1;

                    bot.sendMessage(
                        msg.chat.id,
                        '欢迎新人！\n'
                            + name1,
                        {
                            parse_mode: 'HTML',
                        }
                    );
                }
            }
        }
    });
};
