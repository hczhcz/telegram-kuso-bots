'use strict';

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    bot.onText(/^\/roll(@\w+)?(?: ((?!_)\w*))?$/, event((msg, match) => {
        const title = config.rollGroupTitle[msg.chat.id];

        if (title) {
            let text = '';
            let matchIndex = 2;

            for (const i in title) {
                if (title[i][0] === '/') {
                    let chosen = null;

                    if (match[matchIndex]) {
                        chosen = env.command.tryGet(msg, match[matchIndex], [], false, true);

                        matchIndex += 1;
                    }

                    if (!chosen) {
                        chosen = env.command.tryGet(msg, title[i].slice(1), [], false, true);
                    }

                    if (!chosen) {
                        text = '';

                        break;
                    }

                    text += chosen.text;
                } else {
                    text += title[i];
                }
            }

            bot.setChatTitle(
                msg.chat.id,
                text
            );
        }
    }, 1));
};
