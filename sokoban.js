'use strict';

const fs = require('fs');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.sokobanToken);

const resource = require('./sokoban.resource');
const play = require('./sokoban.play');

const fd = fs.openSync('log_sokoban', 'a');

const log = (head, body) => {
    fs.write(fd, '[' + Date() + '] ' + head + ' ' + body + '\n', () => {
        // nothing
    });
};

const event = (handler, atIndex) => {
    return (msg, match) => {
        if (!match[atIndex] || match[atIndex] === '@' + config.sokobanUsername) {
            log(
                msg.chat.id + ':' + msg.from.id + '@' + (msg.from.username || ''),
                match[0]
            );

            if (!config.ban[msg.from.id]) {
                handler(msg, match);
            }
        }
    };
};

const messageUpdate = (msg, game, win) => {
    if (game.update) {
        game.update = () => {
            messageUpdate(msg, game, win);
        };

        return;
    }

    const matrix = [[{
        text: game.levelId + ' - ' + game.levelIndex,
        callback_data: 'title',
    }]];

    for (let i = 0; i < Math.min(game.map.length, 12); i += 1) {
        matrix.push([]);

        for (let j = 0; j < Math.min(game.map[i].length, 8); j += 1) {
            const globalI = i + game.viewport[0];
            const globalJ = j + game.viewport[1];

            let display = {
                '#': '\u2b1b',
                ' ': ' ',
                '.': '\ud83d\udd36',
                '@': '\ud83d\udc34',
                '+': '\ud83e\udd84',
                '$': '\ud83c\udf11',
                '*': '\ud83c\udf15',
            };

            if (game.active && game.active[0] === globalI && game.active[1] === globalJ) {
                display = {
                    '$': '\ud83c\udf1a',
                    '*': '\ud83c\udf1d',
                };
            }

            matrix[i + 1].push({
                text: display[game.map[globalI][globalJ]],
                callback_data: JSON.stringify([globalI, globalJ]),
            });
        }
    }

    if (!win) {
        matrix.push([{
            text: '撤销 (' + game.history.length + ')',
            callback_data: 'undo',
        }]);

        matrix.push([{
            text: '克隆',
            callback_data: 'clone',
        }, {
            text: '导出',
            callback_data: 'export',
        }]);
    }

    const matrixStr = JSON.stringify(matrix);

    if (!game.lastMatrix || game.lastMatrix() !== matrixStr) {
        game.update = () => {
            // nothing
        };

        setTimeout(() => {
            const update = game.update;

            delete game.update;

            update();
        }, config.sokobanUpdateDelay);

        game.lastMatrix = () => {
            return matrixStr;
        };

        bot.editMessageReplyMarkup(
            {
                inline_keyboard: matrix,
            },
            {
                chat_id: msg.chat.id,
                message_id: msg.message_id,
            }
        );
    }
};

const gameStat = (msg, game) => {
    let move = 0;
    let push = 0;

    for (const i in game.history) {
        if (game.history[i].length === 3) {
            move += 1;
        } else if (game.history[i].length === 5) {
            push += 1;
        }
    }

    bot.sendMessage(
        msg.chat.id,
        '好耶～箱子都被推到正确的地方了！\n\n'
            + '总共 ' + game.history.length + ' 项操作\n'
            + '其中 ' + move + ' 次移动\n'
            + push + ' 次推动箱子\n\n'
            + '/sokoban@' + config.sokobanUsername + ' 开始新游戏',
        {
            reply_to_message_id: msg.message_id,
        }
    );
};

bot.onText(/^\/sokoban(@\w+)?(?: (\w+)(?: (\d+))?)?$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        '仓库play什么的最棒了！',
        {
            reply_to_message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: [[{
                    text: '...',
                    callback_data: '-',
                }]],
            },
        }
    ).then((sentmsg) => {
        resource.load(
            match[2],
            match[3]
                ? parseInt(match[3], 10)
                : null,
            (level, levelId, levelIndex) => {
                // loaded

                play.init(
                    sentmsg.chat.id + '_' + sentmsg.message_id,
                    level,
                    levelId,
                    levelIndex,
                    msg.reply_to_message && msg.reply_to_message.text
                        ? JSON.parse(msg.reply_to_message.text)
                        : null,
                    (game) => {
                        // game init

                        messageUpdate(
                            sentmsg,
                            game,
                            false
                        );
                    },
                    (game) => {
                        // game win

                        fs.write(fd, JSON.stringify(game) + '\n', () => {
                            // nothing
                        });

                        messageUpdate(
                            sentmsg,
                            game,
                            true
                        );

                        gameStat(
                            sentmsg,
                            game
                        );
                    },
                    () => {
                        // game exist

                        // never reach
                        throw Error(JSON.stringify(sentmsg));
                    }
                );
            },
            () => {
                // not valid

                bot.editMessageText(
                    '你…要带我去哪里？',
                    {
                        chat_id: sentmsg.chat.id,
                        message_id: sentmsg.message_id,
                        reply_to_message_id: msg.message_id,
                    }
                );
            }
        );
    });
}, 1));

bot.onText(/^\/help(@\w+)?$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        '命令列表：\n'
            + '/sokoban 开始新游戏\n'
            + '/sokoban <level id> 指定关卡组开始新游戏\n'
            + '/sokoban <level id> <level index> 指定关卡开始新游戏\n'
            + '/help 显示帮助\n'
            + '/status 查看 bot 状态\n'
            + '\n'
            + '备注：\n'
            + '/sokoban 可从回复的消息中还原游戏'
    );
}, 1));

bot.onText(/^\/status(@\w+)?$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        '当前活跃游戏 ' + play.count(),
        {
            reply_to_message_id: msg.message_id,
        }
    );
}, 1));

bot.on('callback_query', (query) => {
    // TODO: undo

    const msg = query.message;

    if (!msg || config.ban[query.from.id] || query.data === '-') {
        return;
    }

    if (query.data.match(/^\w+$/)) {
        log(
            msg.chat.id + '_' + msg.message_id + ':callback:' + query.from.id + '@' + (query.from.username || ''),
            query.data
        );

        if (query.data === 'undo') {
            play.undo(
                msg.chat.id + '_' + msg.message_id,
                (game) => {
                    // undo finished

                    messageUpdate(
                        msg,
                        game,
                        false
                    );

                    if (game.updateExport) {
                        game.updateExport();
                    }

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
        } else if (query.data === 'clone') {
            play.get(
                msg.chat.id + '_' + msg.message_id,
                (game) => {
                    // got

                    bot.sendMessage(
                        msg.chat.id,
                        '仓库play什么的最棒' + msg.text.slice('仓库play什么的最'.length),
                        {
                            reply_to_message_id: msg.message_id,
                        }
                    ).then((sentmsg) => {
                        play.init(
                            sentmsg.chat.id + '_' + sentmsg.message_id,
                            game.level,
                            game.levelId,
                            game.levelIndex,
                            game.history,
                            (newGame) => {
                                // game init

                                messageUpdate(
                                    sentmsg,
                                    newGame,
                                    false
                                );
                            },
                            (newGame) => {
                                // game win

                                fs.write(fd, JSON.stringify(newGame) + '\n', () => {
                                    // nothing
                                });

                                messageUpdate(
                                    sentmsg,
                                    newGame,
                                    true
                                );

                                gameStat(
                                    sentmsg,
                                    game
                                );
                            },
                            () => {
                                // game exist

                                // never reach
                                throw Error(JSON.stringify(sentmsg));
                            }
                        );
                    });

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
        } else if (query.data === 'export') {
            play.get(
                msg.chat.id + '_' + msg.message_id,
                (game) => {
                    // got

                    if (game.updateExport) {
                        return;
                    }

                    game.updateExport = () => {
                        // nothing
                    };

                    bot.sendMessage(
                        msg.chat.id,
                        JSON.stringify(game.history),
                        {
                            reply_to_message_id: msg.message_id,
                        }
                    ).then((sentmsg) => {
                        game.updateExport = () => {
                            bot.editMessageText(
                                JSON.stringify(game.history),
                                {
                                    chat_id: sentmsg.chat.id,
                                    message_id: sentmsg.message_id,
                                    reply_to_message_id: msg.message_id,
                                }
                            );
                        };
                    });

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
        }
    } else {
        const info = JSON.parse(query.data);

        if (typeof info[0] !== 'number' || typeof info[1] !== 'number') {
            throw Error(JSON.stringify(query));
        }

        log(
            msg.chat.id + '_' + msg.message_id + ':callback:' + query.from.id + '@' + (query.from.username || ''),
            info[0] + ' ' + info[1]
        );

        play.click(
            msg.chat.id + '_' + msg.message_id,
            query.from.id,
            info[0],
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
                // game step

                messageUpdate(
                    msg,
                    game,
                    false
                );

                if (game.updateExport) {
                    game.updateExport();
                }

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

                gameStat(
                    msg,
                    game
                );

                if (game.updateExport) {
                    game.updateExport();
                }

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
    }
});
