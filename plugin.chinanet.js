'use strict';

const fs = require('fs');

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    const fd = fs.openSync('log.chinanet', 'a');

    const genEvent = (key) => {
        return (msg, match) => {
            fs.write(fd, JSON.stringify({
                msg: msg,
            }) + '\n', () => {
                // nothing
            });

            env.command.get(msg, key, []);
        };
    };

    for (const i in config.chinanetCommandMap) {
        bot.onText(config.chinanetCommandMap[i], event(genEvent(i), -1));
    }
};
