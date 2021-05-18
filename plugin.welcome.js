'use strict';

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    const welcomePairs = {};
    const leavePairs = {};

    const gen = (command, pairs, msg, user) => {
        const name1 = user.username
            ? '@' + user.username
            : user.first_name;

        if (pairs[msg.chat.id] && pairs[msg.chat.id] !== name1) {
            const name2 = pairs[msg.chat.id];

            delete pairs[msg.chat.id];

            env.command.get(msg, command, [name1, name2]);
        } else {
            delete pairs[msg.chat.id];

            pairs[msg.chat.id] = name1;

            if (Object.keys(pairs).length > config.welcomeMaxEntry) {
                for (const i in pairs) {
                    delete pairs[i];

                    break;
                }
            }

            env.command.get(msg, command, [name1]);
        }
    };

    const welcomeEvent = event((msg, match) => {
        for (const i in msg.new_chat_members) {
            if (msg.new_chat_members[i].username === config.threesomeUsername) {
                env.info.welcome(msg);
            } else {
                gen('welcome', welcomePairs, msg, msg.new_chat_members[i]);
            }
        }
    }, -1);

    const leaveEvent = event((msg, match) => {
        if (msg.left_chat_member.username !== config.threesomeUsername) {
            gen('leave', leavePairs, msg, msg.left_chat_member);
        }
    }, -1);

    bot.on('message', (msg) => {
        if (config.ban[msg.from.id] || config.threesomeSilent[msg.chat.id]) {
            return;
        }

        if (msg.new_chat_members) {
            welcomeEvent(msg, ['<new chat member>']);
        }

        if (msg.left_chat_member) {
            leaveEvent(msg, ['<left chat member>']);
        }
    });

    env.info.addPluginHelp(
        'welcome',
        '<new chat member> 欢迎新人\n'
            + '<left chat member> 有人跑了'
    );
};
