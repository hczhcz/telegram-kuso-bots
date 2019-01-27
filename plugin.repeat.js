'use strict';

const fs = require('fs');

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    const fd = fs.openSync('log.repeat', 'a');

    const lastText = {};

    bot.on('message', (msg) => {
        if (msg.text && !config.threesomeSilent[msg.chat.id]) {
            if (!lastText[msg.chat.id]) {
                lastText[msg.chat.id] = [msg.text, 1];

                if (Object.keys(lastText).length > config.repeatMaxEntry) {
                    for (const i in lastText) {
                        delete lastText[i];

                        break;
                    }
                }
            } else if (lastText[msg.chat.id][0] === msg.text) {
                lastText[msg.chat.id][1] += 1;

                if (lastText[msg.chat.id][1] === 3) {
                    const text = lastText[msg.chat.id];

                    delete lastText[msg.chat.id];

                    fs.write(fd, JSON.stringify(text) + '\n', () => {
                        // nothing
                    });

                    env.command.get(msg, 'repeat', []);
                }
            } else {
                lastText[msg.chat.id] = [msg.text, 1];
            }
        }
    });

    env.info.addPluginHelp(
        'repeat',
        '插件 repeat\n'
            + '插件 repeat'
    );
};
