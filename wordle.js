'use strict';

const fs = require('fs');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.wordleToken);
const multiplayer = require('./multiplayer')();

const play = require('./wordle.play');

const fd = fs.openSync('log_wordle', 'a');

const log = (head, body) => {
    fs.write(fd, '[' + Date() + '] ' + head + ' ' + body + '\n', () => {
        // nothing
    });
};

const event = (handler, atIndex) => {
    return (msg, match) => {
        if (!match[atIndex] || match[atIndex] === '@' + config.wordleUsername) {
            log(
                msg.chat.id + '@' + (msg.chat.username || '')
                    + ':' + msg.from.id + '@' + (msg.from.username || ''),
                match[0]
            );

            // notice: take care of the inline query event
            if (!config.ban[msg.from.id]) {
                handler(msg, match);
            }
        }
    };
};

const playerLine = (player) => {
    if (player) {
        return '\n'
            + '\n'
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

    for (let i = 0; i < list.length; i += 1) {
        info += (list[i].username || list[i].first_name) + '\n';
        total += 1;
    }

    info += '（总共' + total + '人）';

    return info;
};

const playerUpdate = (msg, list) => {
    if (list.update) {
        list.update = () => {
            playerUpdate(msg, list);
        };

        return;
    }

    list.update = () => {
        // nothing
    };

    bot.editMessageText(
        playerInfo(list) + '\n'
            + '\n'
            + '/wordle@' + config.wordleUsername + ' 开始新游戏\n'
            + '/eldrow@' + config.wordleUsername + ' 结束游戏',
        {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            reply_to_message_id: msg.reply_to_message.message_id,
            reply_markup: {
                inline_keyboard: [[{
                    text: '加入',
                    callback_data: 'join',
                }, {
                    text: '离开',
                    callback_data: 'flee',
                }, {
                    text: '清空',
                    callback_data: 'clear',
                }]],
            },
        }
    ).finally(() => {
        setTimeout(() => {
            const update = list.update;

            delete list.update;

            update();
        }, config.multiplayerUpdateDelay);
    });
};

const gameInfo = (guess, hint) => {
    let info = '猜测历史：\n';
    let total = 0;

    // TODO
    for (const i in guess) {
        info += i.slice(1) + ' ' + guess[i] + '\n';
        total += 1;
    }

    info += '（总共' + total + '次）\n'
        + '\n'
        + '猜测目标：\n'
        + hint;

    return info;
};

const gameEnd = (game) => {
    for (const i in game.guess) {
        const sentmsg = game.guess[i].msg;

        if (sentmsg) {
            bot.deleteMessage(sentmsg.chat.id, sentmsg.message_id);
        }
    }

    fs.write(fd, JSON.stringify(game) + '\n', () => {
        // nothing
    });
};

const gameEvent = event((msg, match) => {
    play.guess(
        msg.chat.id,
        match[0],
        (game) => {
            // guess

            bot.sendMessage(
                msg.chat.id,
                gameInfo(game.guess, game.hint) + playerLine(multiplayer.get(msg.chat.id)),
                {
                    reply_to_message_id: msg.message_id,
                }
            ).then((sentmsg) => {
                if (game.active) {
                    game.guess['#' + match[0]].msg = sentmsg;
                } else {
                    bot.deleteMessage(sentmsg.chat.id, sentmsg.message_id);
                }
            });
        },
        (game) => {
            // game end

            gameEnd(game);

            bot.sendMessage(
                msg.chat.id,
                gameInfo(game.guess, game.charset) + '\n'
                    + '\n'
                    + '猜对啦！答案是：\n'
                    + game.answer + '\n'
                    + '\n'
                    + '/wordle@' + config.wordleUsername + ' 开始新游戏\n'
                    + '/wordles@' + config.wordleUsername + ' 多人模式',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },
        () => {
            // guess duplicated

            bot.sendMessage(
                msg.chat.id,
                '已经猜过啦',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },
        () => {
            // not valid

            bot.sendMessage(
                msg.chat.id,
                '这个单词不在词汇表里哦',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },
        () => {
            // game not exist

            // never reach
            throw Error(JSON.stringify(msg));
        }
    );
}, -1);

bot.onText(/^[a-z]5$/, (msg, match) => {
    multiplayer.verify(
        msg.chat.id,
        msg.from,
        () => {
            // valid

            gameEvent(msg, match);
        },
        () => {
            // not valid
        }
    );
});

bot.onText(/^\/wordle(@\w+)?$/, event((msg, match) => {
    play.init(
        msg.chat.id,
        (game) => {
            // game init

            bot.sendMessage(
                msg.chat.id,
                '游戏开始啦',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },
        () => {
            // game exist

            bot.sendMessage(
                msg.chat.id,
                '已经开始啦',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        }
    );
}, 1));

bot.onText(/^\/wordles(@\w+)?$/, event((msg, match) => {
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
            ).then((sentmsg) => {
                playerUpdate(
                    sentmsg,
                    list
                );
            });
        },
        (list) => {
            // player exist

            bot.sendMessage(
                msg.chat.id,
                '一大波玩家正在赶来……',
                {
                    reply_to_message_id: msg.message_id,
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
            ).then((sentmsg) => {
                playerUpdate(
                    sentmsg,
                    list
                );
            });
        },
        (list) => {
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
}, 1));

bot.onText(/^\/eldrow(@\w+)?$/, event((msg, match) => {
    play.end(
        msg.chat.id,
        (game) => {
            // game end

            gameEnd(game);

            bot.sendMessage(
                msg.chat.id,
                gameInfo(game.guess, game.charset) + '\n'
                    + '\n'
                    + '游戏结束啦，答案是：\n'
                    + game.answer + '\n'
                    + '\n'
                    + '/wordle@' + config.wordleUsername + ' 开始新游戏\n'
                    + '/wordles@' + config.wordleUsername + ' 多人模式',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },
        () => {
            // game not exist

            bot.sendMessage(
                msg.chat.id,
                '不存在的！\n'
                    + '\n'
                    + '/wordle@' + config.wordleUsername + ' 开始新游戏\n'
                    + '/wordles@' + config.wordleUsername + ' 多人模式',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        }
    );
}, 1));

bot.onText(/^\/help(@\w+)?$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        'Wordle 猜词游戏\n'
            + '\n'
            + '命令列表：\n'
            + '/wordle 开始新游戏\n'
            + '/wordles 多人模式\n'
            + '/eldrow 结束游戏\n'
            + '/help 显示帮助\n'
            + '/status 查看 bot 状态\n'
            + '\n'
            + '源码：\n'
            + 'https://github.com/hczhcz/telegram-kuso-bots'
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
    const msg = query.message;

    if (!msg || config.ban[query.from.id]) {
        return;
    }

    if (query.data === 'join') {
        log(
            msg.chat.id + '@' + (msg.chat.username || '')
                + ':callback:' + query.from.id + '@' + (query.from.username || ''),
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
            (list) => {
                // player exist

                bot.answerCallbackQuery(query.id).catch((err) => {
                    // nothing
                });
            },
            (list) => {
                // list full

                bot.answerCallbackQuery(query.id).catch((err) => {
                    // nothing
                });
            }
        );
    } else if (query.data === 'flee') {
        log(
            msg.chat.id + '@' + (msg.chat.username || '')
                + ':callback:' + query.from.id + '@' + (query.from.username || ''),
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
    } else if (query.data === 'clear') {
        log(
            msg.chat.id + '@' + (msg.chat.username || '')
                + ':callback:' + query.from.id + '@' + (query.from.username || ''),
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
    }
});
