'use strict';

const fs = require('fs');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.abToken);
const multiplayer = require('./multiplayer');

const play = require('./1a2b.play');

const fd = fs.openSync('log_1a2b', 'a');

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

        // notice: take care of the inline query event
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
            + '/1a2b@' + config.abUsername + ' 开始新游戏\n'
            + '/0a0b@' + config.abUsername + ' 结束游戏',
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
    );
};

const gameInfo = (guess, hint) => {
    let info = '猜测历史：\n';
    let total = 0;

    for (const i in guess) {
        info += i.slice(1) + ' ' + guess[i][0] + 'A' + guess[i][1] + 'B\n';
        total += 1;
    }

    info += '（总共' + total + '次）\n\n'
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
                gameInfo(game.guess, game.charset) + '\n\n'
                    + '猜对啦！答案是：\n'
                    + game.answer + '\n\n'
                    + '/1a2b@' + config.abUsername + ' 开始新游戏\n'
                    + '/3a4b@' + config.abUsername + ' 多人模式',
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
            // game not exist

            // never reach
            throw Error(JSON.stringify(msg));
        }
    );
});

bot.onText(/^[^\n\r\s]+$/, (msg, match) => {
    play.verify(
        msg.chat.id,
        match[0],
        () => {
            // valid

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
        },
        () => {
            // not valid
        },
        () => {
            // game not exist
        }
    );
});

bot.onText(/^\/1a2b(@\w+)?(?: ([^\0]+))?$/, event((msg, match) => {
    play.init(
        msg.chat.id,
        match[2] || msg.reply_to_message && msg.reply_to_message.text || '',
        msg.from.id,
        (game) => {
            // game init

            bot.sendMessage(
                msg.chat.id,
                '游戏开始啦，猜测目标：\n'
                    + game.hint + playerLine(multiplayer.get(msg.chat.id)) + '\n\n'
                    + '将根据第一次猜测决定答案长度',
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
}));

bot.onText(/^\/3a4b(@\w+)?$/, event((msg, match) => {
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
        (list) => {
            // player exist

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
}));

bot.onText(/^\/0a0b(@\w+)?$/, event((msg, match) => {
    play.end(
        msg.chat.id,
        (game) => {
            // game end

            gameEnd(game);

            if (game.answer) {
                bot.sendMessage(
                    msg.chat.id,
                    gameInfo(game.guess, game.charset) + '\n\n'
                        + '游戏结束啦，答案是：\n'
                        + game.answer + '\n\n'
                        + '/1a2b@' + config.abUsername + ' 开始新游戏\n'
                        + '/3a4b@' + config.abUsername + ' 多人模式',
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            } else {
                bot.sendMessage(
                    msg.chat.id,
                    '游戏结束啦\n\n'
                        + '/1a2b@' + config.abUsername + ' 开始新游戏\n'
                        + '/3a4b@' + config.abUsername + ' 多人模式',
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            }
        },
        () => {
            // game not exist

            bot.sendMessage(
                msg.chat.id,
                '不存在的！\n\n'
                    + '/1a2b@' + config.abUsername + ' 开始新游戏\n'
                    + '/3a4b@' + config.abUsername + ' 多人模式',
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

    if (query.data === 'join') {
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
    } else if (query.data === 'clear') {
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
                title: '喵a喵b',
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
                title: '喵a喵b',
                input_message_content: {
                    message_text: (
                        query.from.username
                            ? '@' + query.from.username
                            : query.from.first_name
                    ) + ' 喵喵模式已装载！\n\n'
                        + '/1a2b@' + config.abUsername + ' 开始新游戏\n'
                        + '/3a4b@' + config.abUsername + ' 多人模式\n'
                        + '/0a0b@' + config.abUsername + ' 结束游戏',
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
