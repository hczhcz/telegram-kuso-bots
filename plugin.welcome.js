'use strict';

module.exports = (bot, event, playerEvent, env) => {
    const pairs = {};

    bot.on('message', (msg) => {
        if (msg.new_chat_members) {
            for (const i in msg.new_chat_members) {
                const name1 = '@' + msg.new_chat_members[i].username
                    || msg.new_chat_members[i].first_name;

                if (pairs[msg.chat.id]) {
                    const name2 = pairs[msg.chat.id];

                    delete pairs[msg.chat.id];

                    env.command.get(msg, 'welcome', [name1, name2]);
                } else {
                    pairs[msg.chat.id] = name1;

                    env.command.get(msg, 'welcome', [name1]);
                }
            }
        }

        if (msg.left_chat_member) {
            const name1 = '@' + msg.left_chat_member.username
                || msg.left_chat_member.first_name;

            env.command.get(msg, 'leave', [name1]);
        }
    });
};
