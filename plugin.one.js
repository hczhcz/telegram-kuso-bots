'use strict';

const fs = require('fs');
const readline = require('readline');
const GraphemeSplitter = require('grapheme-splitter');

const config = require('./config');

const splitter = new GraphemeSplitter();

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
        for (const i in chars) {
            if (
                obj.text === chars[i].text
                && obj.from_id === chars[i].from_id
            ) {
                return;
            }
        }

        chars.push(obj);

        fs.write(fdChars, JSON.stringify(obj) + '\n', () => {
            // nothing
        });
    };

    bot.onText(/^.$/, event((msg, match) => {
        if (splitter.splitGraphemes(msg.text).length !== 1) {
            return;
        }

        if (msg.forward_from) {
            addChar({
                text: msg.text,
                from_id: msg.forward_from.id,
                chat_id: msg.chat.id,
                message_id: msg.message_id,
            });
        } else {
            addChar({
                text: msg.text,
                from_id: msg.from.id,
                chat_id: msg.chat.id,
                message_id: msg.message_id,
            });
        }
    }, -1));

    bot.onText(/^\/one(@\w+)?(?: (.+))?$/, event((msg, match) => {
        const text = splitter.splitGraphemes(match[2] || msg.reply_to_message && msg.reply_to_message.text);
        const selected = [];

        for (const i in text) {
            const options = [];

            for (const j in chars) {
                if (chars[j].text === text[i]) {
                    options.push(chars[j]);
                }
            }

            if (options.length) {
                selected.push(options[Math.floor(Math.random() * options.length)]);
            }
        }

        const send = () => {
            if (selected.length) {
                const option = selected.shift();

                bot.forwardMessage(
                    msg.chat.id,
                    option.chat_id,
                    option.message_id
                ).then(send);
            }
        };

        send();
    }, 1));
};
