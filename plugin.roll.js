'use strict';

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    bot.onText(/^\/roll(@\w+)?(( (?:(?!_)\w+))*)$/, event((msg, match) => {
        const title = config.rollGroupTitle[msg.chat.id];
        const args = match[2].split(' ').slice(1);

        if (title) {
            let text = '';

            for (const i in title) {
                if (title[i][0] === '/') {
                    let chosen = null;

                    if (args.length) {
                        chosen = env.command.tryGet(msg, args.shift(), [], false, true);
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

    env.info.addPluginHelp(
        'roll',
        '/roll <trigger(s)> 更换群标题'
    );
};
