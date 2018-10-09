'use strict';

const fs = require('fs');
const readline = require('readline');

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    const chars = [];

    readline.createInterface({
        input: fs.createReadStream(config.onePathChars),
    }).on('line', (line) => {
        const obj = JSON.parse(line);

        chars.push(obj);
    });

    const fdChars = fs.openSync(config.onePathChars, 'a');

    const addChar = (obj) => {
        chars.push(obj);

        fs.write(fdChars, JSON.stringify(obj) + '\n', () => {
            // nothing
        });
    };

    bot.onText(/^.$/, event((msg, match) => {
        if (msg.text.length !== 1) {
            return;
        }

        addChar({
            text: msg.text,
            chat_id: msg.chat.id,
            message_id: msg.message_id,
        });
    }, -1));

    bot.onText(/^\/one(@\w+)? (.+)$/, event((msg, match) => {
        const selected = [];

        for (const i in match[2]) {
            const options = [];

            for (const j in chars) {
                if (chars[j].text === match[2][i]) {
                    options.push(chars[j]);
                }
            }

            selected.push(options[Math.floor(Math.random() * options.length)]);
        }

        for (const i in selected) {
            bot.forwardMessage(
                msg.chat.id,
                selected[i].chat_id,
                selected[i].message_id
            );
        }
    }, 1));
};
