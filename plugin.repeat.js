'use strict';

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    const lastText = {};

    bot.on('message', (msg) => {
        if (!msg.text) {
            return;
        }

        console.error(lastText[msg.chat.id])

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
                delete lastText[msg.chat.id];

                env.command.get(msg, 'repeat', []);
            }
        } else {
            lastText[msg.chat.id] = [msg.text, 1];
        }
    });
};
