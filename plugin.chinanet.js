'use strict';

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
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
