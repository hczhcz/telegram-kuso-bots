'use strict';

const fs = require('fs');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.bombToken);
const multiplayer = require('./multiplayer')();

const play = require('./bomb.play');

const fd = fs.openSync('log_bomb', 'a');

const log = (head, body) => {
    fs.write(fd, '[' + Date() + '] ' + head + ' ' + body + '\n', () => {
        // nothing
    });
};

const event = (handler, atIndex) => {
    return (msg, match) => {
        if (!match[atIndex] || match[atIndex] === '@' + config.bombUsername) {
            log(
                msg.chat.id + '@' + (msg.chat.username || '')
                    + ':' + msg.from.id + '@' + (msg.from.username || ''),
                match[0]
            );

            if (!config.ban[msg.from.id]) {
                handler(msg, match);
            }
        }
    };
};

const playerMention = (player) => {
    return player.username
        ? '@' + player.username
        : player.first_name;
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
            + '/ignite@' + config.bombUsername + ' 点火',
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

bot.onText(/^\/ignite(@\w+)?(?: (.+))?$/, event((msg, match) => {
    const player = multiplayer.getRandom(msg.chat.id);

    const image = msg.reply_to_message
        && msg.reply_to_message.sticker
        && msg.reply_to_message.sticker.file_id;

    if (player === null) {
        bot.sendMessage(
            msg.chat.id,
            playerMention(msg.from) + ' 点燃了 ' + (match[2] || config.bombDefaultText) + '\n'
                + '他自爆了！\n'
                + '\n'
                + '/bomb@' + config.bombUsername + ' 开始新游戏\n'
                + '/ignite@' + config.bombUsername + ' 点火',
            {
                reply_to_message_id: msg.message_id,
            }
        );
    } else {
        play.init(
            msg.chat.id,
            player,
            match[2] || config.bombDefaultText,
            image || config.bombDefaultImage,
            (game) => {
                // game init

                bot.sendMessage(
                    msg.chat.id,
                    game.text + ' 被点燃啦，第一个拿到它的人是 ' + playerMention(game.player) + '\n'
                        + game.text + ' 还有 ' + game.history[game.history.length - 1][1] + ' 秒爆炸',
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );

                bot.sendSticker(
                    msg.chat.id,
                    image || config.bombDefaultImage
                );
            },
            (game) => {
                // game exist

                bot.sendMessage(
                    msg.chat.id,
                    game.text + ' 已经被点燃了哟，现在在 ' + playerMention(game.player) + ' 的手上\n'
                        + game.text + ' 还有 ' + game.history[game.history.length - 1][1] + ' 秒爆炸',
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            }
        );
    }
}, 1));

bot.onText(/^\/bomb(@\w+)?$/, event((msg, match) => {
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

bot.onText(/^\/help(@\w+)?$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        '丢炸弹游戏\n'
            + '\n'
            + '命令列表：\n'
            + '/bomb 开始新游戏\n'
            + '/ignite 点火\n'
            + '/ignite <name> 点燃某个东西\n'
            + '/help 显示帮助\n'
            + '/status 查看 bot 状态\n'
            + '\n'
            + '备注：\n'
            + '/bomb 可以使用回复的消息中的表情，代替默认的丢炸弹表情\n'
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

bot.on('message', (msg) => {
    if (!msg.sticker || config.ban[msg.from.id]) {
        return;
    }

    play.verify(
        msg.chat.id,
        msg.from,
        msg.sticker.file_id,
        () => {
            // valid

            const player = multiplayer.getRandom(msg.chat.id);

            play.next(
                msg.chat.id,
                player,
                (game) => {
                    // game continue

                    if (msg.from.id === game.player.id) {
                        bot.sendMessage(
                            msg.chat.id,
                            playerMention(msg.from) + ' 竟然把 ' + game.text + ' 丢给了自己！\n'
                                + game.text + ' 还有 ' + game.history[game.history.length - 1][1] + ' 秒爆炸',
                            {
                                reply_to_message_id: msg.message_id,
                            }
                        );
                    } else {
                        bot.sendMessage(
                            msg.chat.id,
                            playerMention(msg.from) + ' 把 ' + game.text + '\n'
                                + '丢给了 ' + playerMention(game.player) + '\n'
                                + game.text + ' 还有 ' + game.history[game.history.length - 1][1] + ' 秒爆炸',
                            {
                                reply_to_message_id: msg.message_id,
                            }
                        );
                    }
                },
                () => {
                    // game not exist

                    // never reach
                    throw Error(JSON.stringify(msg));
                }
            );
        },
        () => {
            // wrong player

            play.end(
                msg.chat.id,
                msg.from,
                (game) => {
                    // game end

                    fs.write(fd, JSON.stringify(game) + '\n', () => {
                        // nothing
                    });

                    bot.sendMessage(
                        msg.chat.id,
                        playerMention(msg.from) + ' 把 ' + game.text + ' 抢走了！\n'
                            + '游戏结束\n'
                            + '\n'
                            + '/bomb@' + config.bombUsername + ' 开始新游戏\n'
                            + '/ignite@' + config.bombUsername + ' 点火',
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
        },
        () => {
            // not valid
        },
        () => {
            // game not exist
        }
    );
});

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

setInterval(() => {
    play.tick((id, game, player) => {
        // game end

        fs.write(fd, JSON.stringify(game) + '\n', () => {
            // nothing
        });

        bot.sendMessage(
            id,
            game.text + ' 在 ' + playerMention(player) + ' 的手上爆炸了！\n'
                + '游戏结束\n'
                + '\n'
                + '/bomb@' + config.bombUsername + ' 开始新游戏\n'
                + '/ignite@' + config.bombUsername + ' 点火'
        );
    });
}, 1000);
