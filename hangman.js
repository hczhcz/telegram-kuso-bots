'use strict';

const fs = require('fs');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.hangmanToken);
const multiplayer = require('./multiplayer');

const resource = require('./hangman.resource');
const play = require('./hangman.play');

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

const playerLine = (player) => {
    if (player) {
        return '\n\n'
            + (
                player.username
                    ? '@' + player.username
                    : player.first_name
            ) + ' 轮到你啦';
    }

    return '';
};

const playerInfo = (list) => {
    let info = '玩家列表：\n';
    let total = 0;

    for (const i in list) {
        info += (list[i].username || list[i].first_name) + '\n';
        total += 1;
    }

    info += '（总共' + total + '人）';

    return info;
};

const playerUpdate = (msg, list) => {
    bot.editMessageText(
        playerInfo(list) + '\n\n'
            + '/hang@' + config.hangmanUsername + ' 开始新游戏',
        {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            reply_to_message_id: msg.reply_to_message.message_id,
            reply_markup: {
                inline_keyboard: [[{
                    text: '加入',
                    callback_data: JSON.stringify(['join']),
                }, {
                    text: '离开',
                    callback_data: JSON.stringify(['flee']),
                }, {
                    text: '清空',
                    callback_data: JSON.stringify(['clear']),
                }]],
            },
        }
    );
};

const messageUpdate = (msg, game, win) => {
    if (game.update) {
        game.update = () => {
            delete game.update;

            messageUpdate(msg, game, win);
        };

        return;
    }

    game.update = () => {
        delete game.update;
    };

    // dict info

    let dictInfo = null;

    for (const i in config.hangmanDict) {
        if (config.hangmanDict[i].id === game.dictSettings()[0]) {
            dictInfo = config.hangmanDict[i];

            break;
        }
    }

    // keyboard

    const matrix = [];
    const lineCount = Math.floor((game.keyboard.length - 1) / 8) + 1;

    const keyPerLine = Math.floor(game.keyboard.length / lineCount);
    const keyRemain = game.keyboard.length - keyPerLine * lineCount;

    for (let i = 0; i < lineCount; i += 1) {
        matrix.push([]);

        const begin = i * keyPerLine + Math.min(i, keyRemain);
        const end = (i + 1) * keyPerLine + Math.min(i + 1, keyRemain);

        for (let j = begin; j < end; j += 1) {
            matrix[i].push({
                text: dictInfo.upperCase
                    ? (game.keyboard[j] || '⨯').toLocaleUpperCase()
                    : game.keyboard[j] || '⨯',
                callback_data: JSON.stringify(['guess', j]),
            });
        }
    }

    // game history

    let totLives = 9;
    let lives = 9;
    let first = true;
    let text = '';

    const createFace = (guess, correct) => {
        const face = [' ', 'ｗ', '・'];

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

        return face;
    };

    const createLMR = (guess, correct) => {
        const lmr = ['　', '||', '　'];

        if (!guess) {
            lmr[1] = 'ひ';
        }

        if (first) {
            lmr[0] = '╰';
            lmr[2] = '╯';
        }

        if (lives === -1 && !correct) {
            lmr[0] = '✄';

            if (guess) {
                lmr[1] = '██';
            }
        }

        return lmr;
    };

    const appendLine = (guess, correct) => {
        if (!correct) {
            lives -= 1;
        }

        const face = createFace(guess, correct);

        text += '( ' + face[0] + face[2] + face[1] + face[2] + ')';

        const lmr = createLMR(guess, correct);

        text += lmr[0] + lmr[1] + lmr[2];

        if (guess) {
            text += ' [ ' + (
                dictInfo.upperCase
                    ? guess.toLocaleUpperCase()
                    : guess
            ) + ' ]';
        }

        text += '\n';

        first = false;
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

    // game info

    const hint = (
        dictInfo.upperCase
            ? (game.hint || game.answer).toLocaleUpperCase()
            : game.hint || game.answer
    ).split('\x01').join('.');

    let endText = '';

    if (win) {
        endText = '\n\n';

        if (totLives > 0) {
            endText += '回答正确～撒花～\n\n';
        } else if (totLives === 0) {
            endText += '回答正确～真是好险呢～\n\n';
        } else if (game.history.length === game.keyboard.length) {
            endText += '卧…卧槽？！\n\n';
        } else {
            endText += '虽然 JJ 已经被 bot 切掉了，但是回答正确～\n\n';
        }

        endText += '/hang@' + config.hangmanUsername + ' 开始新游戏\n'
            + '/diao@' + config.hangmanUsername + ' 多人模式';
    } else {
        endText = playerLine(multiplayer.get(msg.chat.id));
    }

    bot.editMessageText(
        '<pre>'
            + text + '\n'
            + '[ ' + dictInfo.title + ' - ' + game.dictSettings()[1] + ' ]\n'
            + '[ ' + hint + ' ]\n'
            + '[ 剩余生命：' + totLives + ' ]'
            + '</pre>'
            + endText,
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

    // note: telegram's limit
    const keyboardSize = Math.min(parseInt(match[2], 10) || 32, 100);

    for (const i in config.hangmanDict) {
        const dictInfo = config.hangmanDict[i];

        lines.push([{
            text: dictInfo.title,
            callback_data: JSON.stringify(['dict', dictInfo.id, null, keyboardSize]),
        }]);

        if (dictInfo.limit.length) {
            const line = [];

            for (const j in dictInfo.limit) {
                line.push({
                    text: dictInfo.limit[j],
                    callback_data: JSON.stringify(['dict', dictInfo.id, dictInfo.limit[j], keyboardSize]),
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

bot.onText(/^\/diao(@\w+)?$/, event((msg, match) => {
    multiplayer.add(
        msg.chat.id,
        msg.from,
        (list) => {
            // added

            bot.sendMessage(
                msg.chat.id,
                '一大波玩家正在赶来……',
                {
                    reply_to_message_id: msg.message_id,
                }
            ).then((sentmsg) => {
                playerUpdate(
                    sentmsg,
                    list
                );
            });
        },
        () => {
            // player exist

            bot.sendMessage(
                msg.chat.id,
                '你已经加入过啦',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },
        () => {
            // list full

            bot.sendMessage(
                msg.chat.id,
                '玩家列表满啦',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        }
    );
}));

bot.onText(/^\/status(@\w+)?$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        '当前活跃游戏 ' + play.count(),
        {
            reply_to_message_id: msg.message_id,
        }
    );
}));

bot.on('callback_query', (query) => {
    const msg = query.message;
    const info = JSON.parse(query.data);

    if (info[0] === 'join') {
        log(
            msg.chat.id + ':callback:' + query.from.id + '@' + (query.from.username || ''),
            'join'
        );

        multiplayer.add(
            msg.chat.id,
            query.from,
            (list) => {
                // added

                playerUpdate(
                    msg,
                    list
                );

                bot.answerCallbackQuery(query.id).catch((err) => {
                    // nothing
                });
            },
            () => {
                // player exist

                bot.answerCallbackQuery(query.id).catch((err) => {
                    // nothing
                });
            },
            () => {
                // list full

                bot.answerCallbackQuery(query.id).catch((err) => {
                    // nothing
                });
            }
        );
    } else if (info[0] === 'flee') {
        log(
            msg.chat.id + ':callback:' + query.from.id + '@' + (query.from.username || ''),
            'flee'
        );

        multiplayer.remove(
            msg.chat.id,
            query.from,
            (list) => {
                // removed

                playerUpdate(
                    msg,
                    list
                );

                bot.answerCallbackQuery(query.id).catch((err) => {
                    // nothing
                });
            },
            () => {
                // player not exist

                bot.answerCallbackQuery(query.id).catch((err) => {
                    // nothing
                });
            }
        );
    } else if (info[0] === 'clear') {
        log(
            msg.chat.id + ':callback:' + query.from.id + '@' + (query.from.username || ''),
            'clear'
        );

        multiplayer.clear(
            msg.chat.id,
            () => {
                // cleared

                playerUpdate(
                    msg,
                    []
                );

                bot.answerCallbackQuery(query.id).catch((err) => {
                    // nothing
                });
            },
            () => {
                // not multiplayer

                bot.answerCallbackQuery(query.id).catch((err) => {
                    // nothing
                });
            }
        );
    } else if (info[0] === 'dict') {
        if (typeof info[2] !== 'number' && info[2] !== null || typeof info[3] !== 'number') {
            throw Error(JSON.stringify(query));
        }

        log(
            msg.chat.id + '_' + msg.message_id + ':callback:' + query.from.id + '@' + (query.from.username || ''),
            'dict ' + info[1] + ' ' + info[2] + ' ' + info[3]
        );

        resource.load(
            info[1],
            info[2],
            (dict) => {
                // loaded

                play.init(
                    msg.chat.id + '_' + msg.message_id,
                    query.from.id,
                    dict,
                    info[3],
                    (game) => {
                        // game init

                        game.dictSettings = () => {
                            return [info[1], info[2] || dict.list.length];
                        };

                        messageUpdate(
                            msg,
                            game,
                            false
                        );

                        bot.answerCallbackQuery(query.id).catch((err) => {
                            // nothing
                        });
                    },
                    () => {
                        // game exist

                        bot.answerCallbackQuery(query.id).catch((err) => {
                            // nothing
                        });
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

        multiplayer.verify(
            msg.chat.id,
            query.from,
            () => {
                // valid

                play.click(
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

                        bot.answerCallbackQuery(query.id).catch((err) => {
                            // nothing
                        });
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

                        bot.answerCallbackQuery(query.id).catch((err) => {
                            // nothing
                        });
                    },
                    () => {
                        // not valid

                        bot.answerCallbackQuery(query.id).catch((err) => {
                            // nothing
                        });
                    },
                    () => {
                        // game not exist

                        bot.answerCallbackQuery(query.id).catch((err) => {
                            // nothing
                        });
                    }
                );
            },
            () => {
                // not valid

                bot.answerCallbackQuery(query.id).catch((err) => {
                    // nothing
                });
            }
        );
    }
});

bot.on('inline_query', (query) => {
    if (!query.query) {
        bot.answerInlineQuery(
            query.id,
            [],
            {
                cache_time: 0,
                is_personal: true,
            }
        );
    } else if (config.ban[query.from.id]) {
        bot.answerInlineQuery(
            query.id,
            [{
                type: 'article',
                id: 'banned',
                title: 'hang喵',
                input_message_content: {
                    message_text: '该用户因存在恶意使用 bot 的报告，已被列入黑名单',
                },
            }],
            {
                cache_time: 0,
                is_personal: true,
            }
        );
    } else {
        bot.answerInlineQuery(
            query.id,
            [{
                type: 'article',
                id: 'playmeow',
                title: 'hang喵',
                input_message_content: {
                    message_text: (
                        query.from.username
                            ? '@' + query.from.username
                            : query.from.first_name
                    ) + ' 喵喵模式已装载！\n\n'
                        + '/hang@' + config.hangmanUsername + ' 开始新游戏\n'
                        + '/diao@' + config.hangmanUsername + ' 多人模式',
                },
            }],
            {
                cache_time: 0,
                is_personal: true,
            }
        );
    }
});

bot.on('chosen_inline_result', (chosen) => {
    log(
        'inline:' + chosen.from.id + '@' + (chosen.from.username || ''),
        chosen.result_id + ' ' + chosen.query
    );

    if (chosen.result_id === 'playmeow') {
        play.meowInit(chosen.from.id, chosen.query);
    }
});
