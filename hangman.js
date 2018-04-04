'use strict';

const fs = require('fs');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.hangmanToken);

const dictionary = require('./hangman.dictionary');
const gameplay = require('./hangman.gameplay');

const fd = fs.openSync('log_hangman', 'a');

const log = (head, body) => {
    fs.write(fd, '[' + Date() + '] ' + head + ' ' + body + '\n', () => {
        // nothing
    });
};

const event = (handler) => {
    return (msg, match) => {
        log(
            msg.chat.id + ':' + msg.from.id + '@' + (msg.from.username || ''),
            match[0]
        );

        if (!config.ban[msg.from.id]) {
            handler(msg, match);
        }
    };
};

const messageUpdate = (msg, game, win) => {
    const matrix = [];

    for (let i = 0; i < game.keyboard.length / 8; i += 1) {
        matrix.push([]);

        for (let j = i * 8; j < i * 8 + 8 && j < game.keyboard.length; j += 1) {
            matrix[i].push({
                text: (game.keyboard[j] || '⨯').toLocaleUpperCase(),
                callback_data: JSON.stringify(['guess', j]),
            });
        }
    }

    let lives = 9;
    let text = '';

    // '(  ・＿・)╰||╯\n';

    const appendLine = (guess) => {
        if (lives > 3) {
            text += '(  ・＿・)';
        } else if (lives > 0) {
            text += '(  ・Ｗ・)';
        } else if (lives > -3) {
            text += '( *・皿・)';
        } else {
            text += '(  ・皿・)';
        }

        const lmr = ['　', '||', '　'];

        if (lives === 9) {
            lmr[0] = '╰';
            lmr[2] = '╯';
        } else if (lives === 0) {
            lmr[0] = '✄';
            lmr[1] = '██';
        }

        if (guess) {
            text += lmr[0] + lmr[1] + lmr[2] + ' [ ' + guess.toLocaleUpperCase() + ' ]\n';
        } else {
            text += lmr[0] + 'ひ' + lmr[2] + '\n';
        }
    };

    for (const i in game.history) {
        if (!game.history[i][2]) {
            appendLine(game.history[i][1]);

            lives -= 1;
        }
    }

    appendLine(null);

    let winText = '';

    if (win) {
        if (lives > 0) {
            winText = '回答正确～撒花～';
        } else if (lives === 0) {
            winText = '回答正确～真是好险呢～';
        } else {
            winText = '虽然 JJ 已经被 bot 切掉了，但是回答正确～';
        }
    }

    bot.editMessageText(
        '<pre>' + text + '\n'
            + '[ ' + game.hint.toLocaleUpperCase() + ' ]\n'
            + '[ 剩余生命：' + lives + ' ]\n'
            + winText
            + '</pre>',
        {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            parse_mode: 'HTML',
            reply_to_message_id: msg.reply_to_message.message_id,
            reply_markup: {
                inline_keyboard: matrix,
            },
        }
    );
};

bot.onText(/^\/hang(@\w+)?(?: (\d+))?$/, event((msg, match) => {
    const lines = [];

    const keyboardSize = Math.min(parseInt(match[2], 10) || 32, 100);

    for (const i in config.hangmanDict) {
        const dictInfo = config.hangmanDict[i];

        // note: default dict size limit is 1m
        lines.push([{
            text: dictInfo.title,
            callback_data: JSON.stringify(['dict', dictInfo.id, 1000000, keyboardSize]),
        }]);

        if (dictInfo.limits.length) {
            const line = [];

            for (const j in dictInfo.limits) {
                line.push({
                    text: dictInfo.limits[j],
                    callback_data: JSON.stringify(['dict', dictInfo.id, dictInfo.limits[j], keyboardSize]),
                });
            }

            lines.push(line);
        }
    }

    bot.sendMessage(
        msg.chat.id,
        '请选择词典\n\n数字表示的是缩减版哦',
        {
            reply_to_message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: lines,
            },
        }
    );
}));

bot.on('callback_query', (query) => {
    const msg = query.message;
    const info = JSON.parse(query.data);

    if (info[0] === 'dict') {
        if (typeof info[2] !== 'number' || typeof info[3] !== 'number') {
            throw Error(JSON.stringify(query));
        }

        log(
            msg.chat.id + '_' + msg.message_id + ':callback:' + query.from.id + '@' + (query.from.username || ''),
            'dict ' + info[1] + ' ' + info[2] + ' ' + info[3]
        );

        dictionary.load(
            info[1],
            info[2],
            (dict) => {
                // loaded

                gameplay.init(
                    msg.chat.id + '_' + msg.message_id,
                    query.from.id,
                    dict,
                    info[3],
                    (game) => {
                        // game init

                        messageUpdate(
                            msg,
                            game,
                            false
                        );

                        bot.answerCallbackQuery(query.id);
                    },
                    () => {
                        // game exist

                        // never reach
                        throw Error(JSON.stringify(query));
                    }
                );
            },
            () => {
                // not valid

                // never reach
                throw Error(JSON.stringify(query));
            }
        );
    } else if (info[0] === 'guess') {
        if (typeof info[1] !== 'number') {
            throw Error(JSON.stringify(query));
        }

        log(
            msg.chat.id + '_' + msg.message_id + ':callback:' + query.from.id + '@' + (query.from.username || ''),
            'guess ' + info[1]
        );

        gameplay.click(
            msg.chat.id + '_' + msg.message_id,
            query.from.id,
            info[1],
            (game) => {
                // game continue

                messageUpdate(
                    msg,
                    game,
                    false
                );

                bot.answerCallbackQuery(query.id);
            },
            (game) => {
                // game win

                messageUpdate(
                    msg,
                    game,
                    true
                );

                bot.answerCallbackQuery(query.id);
            },
            () => {
                // not valid

                bot.answerCallbackQuery(query.id);
            },
            () => {
                // game not exist

                bot.answerCallbackQuery(query.id);
            }
        );
    }
});
