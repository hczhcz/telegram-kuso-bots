'use strict';

const fs = require('fs');
const canvas = require('canvas');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.wordleToken);
const multiplayer = require('./multiplayer')();

const enResource = require('./wordle.en.resource');
// const cnResource = require('./wordle.cn.resource');
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

const gameImage = (guess, size, total, hint) => {
    let realTotal = total;

    if (hint) {
        realTotal += Math.ceil(13 / size) / 2;
    }

    const width = (64 * size + 8) * Math.ceil(realTotal / 16) - 8;
    const height = 64 * Math.min(realTotal, 16);

    const image = canvas.createCanvas(width, height);
    const ctx = image.getContext('2d');

    const best = {};
    let left = 0;
    let top = 0;

    ctx.font = '48px Helvetica';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const i in guess) {
        for (let j = 0; j < size; j += 1) {
            best[i[j + 1]] = best[i[j + 1]] || '';

            if (best[i[j + 1]] < guess[i][j]) {
                best[i[j + 1]] = guess[i][j];
            }

            ctx.fillStyle = '#787c7e';
            ctx.fillRect(left + j * 64 + 1, top + 1, 62, 62);
            ctx.fillStyle = ['#787c7e', '#c9b458', '#6aaa64'][guess[i][j]];
            ctx.fillRect(left + j * 64 + 2, top + 2, 60, 60);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(i[j + 1].toUpperCase(), left + j * 64 + 32, top + 32);
        }

        top += 64;

        if (top === 1024) {
            left += 64 * size + 8;
            top = 0;
        }
    }

    if (hint) {
        const letter = 'abcdefghijklmnopqrstuvwxyz';

        ctx.font = '24px Helvetica';

        for (const i in letter) {
            const j = i % (size * 2);
            const k = Math.floor(i / (size * 2));

            ctx.fillStyle = '#787c7e';
            ctx.fillRect(left + j * 32 + 1, top + k * 32 + 1, 30, 30);

            if (best[letter[i]]) {
                ctx.fillStyle = ['#787c7e', '#c9b458', '#6aaa64'][best[letter[i]]];
                ctx.fillRect(left + j * 32 + 2, top + k * 32 + 2, 28, 28);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(letter[i].toUpperCase(), left + j * 32 + 16, top + k * 32 + 16);
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(left + j * 32 + 2, top + k * 32 + 2, 28, 28);
                ctx.fillStyle = '#000000';
                ctx.fillText(letter[i].toUpperCase(), left + j * 32 + 16, top + k * 32 + 16);
            }
        }
    }

    return image;
};

const gameEnd = (game) => {
    for (const i in game.msgs) {
        const sentmsg = game.msgs[i];

        bot.deleteMessage(sentmsg.chat.id, sentmsg.message_id);
    }

    delete game.msgs;

    fs.write(fd, JSON.stringify(game) + '\n', () => {
        // nothing
    });
};

const gameEvent = event((msg, match) => {
    enResource.load(
        match.mode,
        match[0].length,
        (dict) => {
            // loaded

            play.guess(
                msg.chat.id,
                dict,
                match[0].toLowerCase(),
                (game) => {
                    // guess

                    const total = Object.keys(game.guess).length;

                    bot.sendPhoto(
                        msg.chat.id,
                        gameImage(game.guess, game.answer.length, total, true).toBuffer(),
                        {
                            caption: '（总共' + total + '次）' + playerLine(multiplayer.get(msg.chat.id)),
                            reply_to_message_id: msg.message_id,
                        }
                    ).then((sentmsg) => {
                        if (game.msgs) {
                            game.msgs.push(sentmsg);
                        } else {
                            bot.deleteMessage(sentmsg.chat.id, sentmsg.message_id);
                        }
                    });
                },
                (game) => {
                    // game end

                    gameEnd(game);

                    const total = Object.keys(game.guess).length;

                    bot.sendPhoto(
                        msg.chat.id,
                        gameImage(game.guess, game.answer.length, total, false).toBuffer(),
                        {
                            caption: '（总共' + total + '次）\n'
                                + '\n'
                                + '猜对啦！答案是：\n'
                                + game.answer + '\n'
                                + '\n'
                                + '/wordle@' + config.wordleUsername + ' 开始新游戏\n'
                                + '/wordles@' + config.wordleUsername + ' 多人模式',
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
        },
        () => {
            // not valid
        }
    );
}, -1);

bot.onText(/^[A-Za-z]+$/, (msg, match) => {
    play.verify(
        msg.chat.id,
        match[0].length,
        (mode) => {
            // valid

            multiplayer.verify(
                msg.chat.id,
                msg.from,
                () => {
                    // valid

                    match.mode = mode;
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

bot.onText(/^\/wordle(@\w+)?(?: (\w+))?$/, event((msg, match) => {
    const mode = match[2] || config.wordleEnDefaultDict;

    enResource.verify(
        mode,
        () => {
            // valid

            play.init(
                msg.chat.id,
                mode,
                (game) => {
                    // game init

                    game.msgs = [];

                    bot.sendMessage(
                        msg.chat.id,
                        '游戏开始啦' + playerLine(multiplayer.get(msg.chat.id)),
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
        },
        () => {
            // not valid

            bot.sendMessage(
                msg.chat.id,
                '不…这样的参数…不可以…',
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

            if (game.answer) {
                const total = Object.keys(game.guess).length;

                bot.sendPhoto(
                    msg.chat.id,
                    gameImage(game.guess, game.answer.length, total, false).toBuffer(),
                    {
                        caption: '（总共' + total + '次）\n'
                            + '\n'
                            + '游戏结束啦，答案是：\n'
                            + game.answer + '\n'
                            + '\n'
                            + '/wordle@' + config.wordleUsername + ' 开始新游戏\n'
                            + '/wordles@' + config.wordleUsername + ' 多人模式',
                        reply_to_message_id: msg.message_id,
                    }
                );
            } else {
                bot.sendMessage(
                    msg.chat.id,
                    '游戏结束啦\n'
                        + '\n'
                        + '/wordle@' + config.wordleUsername + ' 开始新游戏\n'
                        + '/wordles@' + config.wordleUsername + ' 多人模式',
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
            + '/wordle en 开始新游戏（使用 Google Ngrams 词库，默认）\n'
            + '/wordle wordle 开始新游戏（使用 Wordle 官方词库）\n'
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
