'use strict';

module.exports = (bot, event, playerEvent, env) => {
    const pairs = {};

    const welcomeEvent = event((msg, match) => {
        for (const i in msg.new_chat_members) {
            const name1 = '@' + msg.new_chat_members[i].username
                || msg.new_chat_members[i].first_name;

            if (pairs[msg.chat.id]) {
                const name2 = pairs[msg.chat.id];

                delete pairs[msg.chat.id];

                env.command.get(msg, 'welcome', [name2, name1]);
            } else {
                pairs[msg.chat.id] = name1;

                env.command.get(msg, 'welcome', [name1]);
            }
        }
    }, -1);

    const leaveEvent = event((msg, match) => {
        const name1 = '@' + msg.left_chat_member.username
            || msg.left_chat_member.first_name;

        env.command.get(msg, 'leave', [name1]);
    }, -1);

    bot.on('message', (msg) => {
        if (msg.new_chat_members) {
            welcomeEvent(msg, []);
        }

        if (msg.left_chat_member) {
            leaveEvent(msg, []);
        }
    });
};
