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
    if (game.update) {
        game.update = () => {
            delete game.update;

            messageUpdate(msg, game);
        };

        return;
    }

    game.update = () => {
        delete game.update;
    };

    let allLower = true;

    for (const i in game.keyboard) {
        if (game.keyboard[i] && game.keyboard[i].toLocaleLowerCase() !== game.keyboard[i]) {
            allLower = false;

            break;
        }
    }

    const matrix = [];
    const lineCount = Math.floor((game.keyboard.length - 1) / 8) + 1;

    const keyPerLine = Math.floor(game.keyboard.length / lineCount);
    const keyRemain = game.keyboard.length - keyPerLine * lineCount;

    for (let i = 0; i < lineCount; i += 1) {
        matrix.push([]);

        const begin = i * keyPerLine + Math.min(i, keyRemain);
        const end = (i + 1) * keyPerLine + Math.min(i + 1, keyRemain);

        for (let j = begin; j < end; j += 1) {
            const key = {
                text: game.keyboard[j] || '⨯',
                callback_data: JSON.stringify(['guess', j]),
            };

            if (allLower) {
                key.text = key.text.toLocaleUpperCase();
            }

            matrix[i].push(key);
        }
    }

    let totLives = 9;
    let lives = 9;
    let first = true;
    let text = '';

    const appendLine = (guess, correct) => {
        const face = [' ', 'ｗ', '・'];

        if (!correct) {
            lives -= 1;
        }

        if (lives < 3 && lives >= 0) {
            face[0] = '!';
        } else if (lives < 0 && lives >= -3) {
            face[0] = '*';
        }

        if (lives >= 0) {
            if (guess && !correct) {
                face[1] = '＿';
            }
        } else if (correct) {
            face[1] = 'Ａ';
        } else {
            face[1] = '皿';
        }

        if (win) {
            if (totLives === 9) {
                face[2] = '≖';
            } else if (totLives === 0) {
                face[0] = '!';
                face[2] = '☆';
            } else if (game.history.length === game.keyboard.length) {
                face[0] = '*';
                face[2] = '◉';
            }
        }

        text += '( ' + face[0] + face[2] + face[1] + face[2] + ')';

        const lmr = ['　', '||', '　'];

        if (!guess) {
            lmr[1] = 'ひ';
        }

        if (first) {
            lmr[0] = '╰';
            lmr[2] = '╯';

            first = false;
        }

        if (lives === -1 && !correct) {
            lmr[0] = '✄';
            if (guess) {
                lmr[1] = '██';
            }
        }

        text += lmr[0] + lmr[1] + lmr[2];

        if (guess) {
            text += ' [ ' + guess + ' ]';
        }

        text += '\n';
    };

    for (const i in game.history) {
        if (!game.history[i][2]) {
            totLives -= 1;
        }
    }

    for (const i in game.history) {
        appendLine(game.history[i][1], game.history[i][2]);
    }

    appendLine(null, null);

    let dictInfo = null;

    for (const i in config.hangmanDict) {
        if (config.hangmanDict[i].id === game.dictSettings()[0]) {
            dictInfo = config.hangmanDict[i];

            break;
        }
    }

    const limitText = game.dictSettings()[1]
        ? ' - ' + game.dictSettings()[1]
        : '';

    let winText = '';

    if (win) {
        if (totLives > 0) {
            winText = '回答正确～撒花～';
        } else if (totLives === 0) {
            winText = '回答正确～真是好险呢～';
        } else if (game.history.length === game.keyboard.length) {
            winText = '卧…卧槽？！';
        } else {
            winText = '虽然 JJ 已经被 bot 切掉了，但是回答正确～';
        }
    }

    bot.editMessageText(
        '<pre>' + text + '\n'
            + '[ ' + dictInfo.title + limitText + ' ]\n'
            + '[ ' + game.hint.toLocaleUpperCase() + ' ]\n'
            + '[ 剩余生命：' + totLives + ' ]\n'
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
    ).finally(() => {
        setTimeout(() => {
            game.update();
        }, config.hangmanUpdateDelay);
    });
};

bot.onText(/^\/hang(@\w+)?(?: (\d+))?$/, event((msg, match) => {
    const lines = [];

    const keyboardSize = Math.min(parseInt(match[2], 10) || 32, 100);

    for (const i in config.hangmanDict) {
        const dictInfo = config.hangmanDict[i];

        // note: default dict size limit is 1m
        lines.push([{
            text: dictInfo.title,
            callback_data: JSON.stringify(['dict', dictInfo.id, null, keyboardSize]),
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
        if (typeof info[2] !== 'number' && info[2] !== null || typeof info[3] !== 'number') {
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

                        game.dictSettings = () => {
                            return [info[1], info[2]];
                        };

                        messageUpdate(
                            msg,
                            game,
                            false
                        );

                        bot.answerCallbackQuery(query.id).catch((err) => {});
                    },
                    () => {
                        // game exist

                        bot.answerCallbackQuery(query.id).catch((err) => {});
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

                bot.answerCallbackQuery(query.id).catch((err) => {});
            },
            (game) => {
                // game win

                fs.write(fd, JSON.stringify(game) + '\n', () => {
                    // nothing
                });

                messageUpdate(
                    msg,
                    game,
                    true
                );

                bot.answerCallbackQuery(query.id).catch((err) => {});
            },
            () => {
                // not valid

                bot.answerCallbackQuery(query.id).catch((err) => {});
            },
            () => {
                // game not exist

                bot.answerCallbackQuery(query.id).catch((err) => {});
            }
        );
    }
});
