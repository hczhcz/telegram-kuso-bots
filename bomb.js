'use strict';

const fs = require('fs');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.bombToken);
const multiplayer = require('./multiplayer');

const play = require('./bomb.play');

const fd = fs.openSync('log_bomb', 'a');

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

const playerMention = (player) => {
    return player.username
        ? '@' + player.username
        : player.first_name;
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
    );
};

bot.onText(/^\/ignite(@\w+)?(?: (.+))?$/, event((msg, match) => {
    const player = multiplayer.get(msg.chat.id);

    if (player === null) {
        bot.sendMessage(
            msg.chat.id,
            playerMention(msg.from) + ' 点燃了 ' + (match[2] || config.bombDefaultText) + '\n'
                + '他自爆了！\n\n'
                + '/bomb@' + config.bombUsername + ' 开始新游戏\n'
                + '/ignite@' + config.bombUsername + ' 点火',
            {
                reply_to_message_id: msg.message_id,
            }
        );
    } else {
        play.init(
            msg.chat.id,
            player.id,
            match[2] || config.bombDefaultText,
            msg.sticker && msg.sticker.file_id || config.bombDefaultImage,
            (game) => {
                // game init

                bot.sendMessage(
                    msg.chat.id,
                    game.text + ' 被点燃啦，第一个拿到它的人是 ' + playerMention(player) + '\n'
                        + game.text + ' 还有 ' + game.history[game.history.length - 1][1] + ' 秒爆炸',
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            },
            (game) => {
                // game exist

                bot.sendMessage(
                    msg.chat.id,
                    game.text + ' 已经被点燃了哟，现在在 ' + playerMention(player) + ' 的手上\n'
                        + game.text + ' 还有 ' + game.history[game.history.length - 1][1] + ' 秒爆炸',
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            }
        );
    }
}));

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

bot.onText(/^\/status(@\w+)?$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        '当前活跃游戏 ' + play.count(),
        {
            reply_to_message_id: msg.message_id,
        }
    );
}));

bot.on('message', (msg) => {
    if (msg.sticker) {
        play.verify(
            msg.chat.id,
            msg.sticker.file_id,
            () => {
                // valid

                multiplayer.verify(
                    msg.chat.id,
                    msg.from,
                    () => {
                        // valid

                        play.next(
                            msg.chat.id,
                            msg.from.id,
                            (game) => {
                                // game continue

                                const player = multiplayer.get(msg.chat.id);

                                if (msg.from.id === player.id) {
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
                                            + '丢给了 ' + playerMention(player) + '\n'
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
                        // not valid

                        play.end(
                            msg.chat.id,
                            msg.from.id,
                            (game) => {
                                // game end

                                fs.write(fd, JSON.stringify(game) + '\n', () => {
                                    // nothing
                                });

                                bot.sendMessage(
                                    msg.chat.id,
                                    playerMention(msg.from) + ' 把 ' + game.text + ' 抢走了！\n'
                                        + '游戏结束\n\n'
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
    }
});

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

setInterval(() => {
    play.tick((id, game) => {
        // game end

        fs.write(fd, JSON.stringify(game) + '\n', () => {
            // nothing
        });

        bot.sendMessage(
            id,
            game.text + ' 在 ' + playerMention(multiplayer.get(id)) + ' 的手上爆炸了！\n'
                + '游戏结束\n\n'
                + '/bomb@' + config.bombUsername + ' 开始新游戏\n'
                + '/ignite@' + config.bombUsername + ' 点火'
        );
    });
}, 1000);
