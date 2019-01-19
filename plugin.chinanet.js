'use strict';

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    bot.onText(/^\/listre(@\w+)?$/, event((msg, match) => {
        let text = '';

        for (const i in config.chinanetCommandMap) {
            text += config.chinanetCommandMap[i] + ' -> ' + i + '\n';
        }

        bot.sendMessage(
            msg.chat.id,
            text,
            {
                reply_to_message_id: msg.message_id,
            }
        );
    }, 1));

    const genEvent = (key) => {
        return (msg, match) => {
            if (!config.threesomeSilent[msg.chat.id]) {
                env.command.get(msg, key, []);
            }
        };
    };

    for (const i in config.chinanetCommandMap) {
        bot.onText(config.chinanetCommandMap[i], event(genEvent(i), -1));
    }
};
