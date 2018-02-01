'use strict';

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.abToken);

const gameplay = require('./1a2b.gameplay');

process.on('uncaughtException', (err) => {
    console.error(err);
});

const event = (handler) => {
    return (msg, match) => {
        console.log('[' + Date() + '] ' + msg.chat.id + ':' + msg.from.id + '@' + (msg.from.username || '') + ' ' + match[0]);

        // notice: take care of the inline query event
        if (!config.ban[msg.from.id]) {
            handler(msg, match);
        }
    };
};

const gameInfo = (game) => {
    let info = '猜测历史：\n';
    let total = 0;

    for (const i in game.guess) {
        info += i.slice(1) + ' ' + game.guess[i][0] + 'A' + game.guess[i][1] + 'B\n';
        total += 1;
    }

    info += '（总共' + total + '次）\n\n'
        + '猜测目标：\n'
        + (game.hint || game.charset);

    return info;
};

const gameEnd = (game) => {
    for (const i in game.guess) {
        const sentmsg = game.guess[i].msg;

        if (sentmsg) {
            bot.deleteMessage(sentmsg.chat.id, sentmsg.message_id);
        }
    }

    console.log(JSON.stringify(game));
};

const gameEvent = event((msg, match) => {
    gameplay.guess(
        msg.chat.id,
        match[0],
        (game) => {
            // guess

            return bot.sendMessage(
                msg.chat.id,
                gameInfo(game),
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

            return bot.sendMessage(
                msg.chat.id,
                gameInfo(game) + '\n\n'
                    + '猜对啦！答案是：\n'
                    + game.answer + '\n\n'
                    + '/1a2b 开始新游戏',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },
        () => {
            // guess duplicated

            return bot.sendMessage(
                msg.chat.id,
                '已经猜过啦',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },
        () => {
            // game not exist
        }
    );
});

bot.onText(/^[^\n\r\s]+$/, (msg, match) => {
    gameplay.verify(
        msg.chat.id,
        match[0],
        () => {
            // valid

            gameEvent(msg, match);
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
    gameplay.init(
        msg.chat.id,
        match[2] || msg.reply_to_message && msg.reply_to_message.text || '',
        msg.from.id,
        config.abMaxCharsetLength,
        (game) => {
            // game init

            return bot.sendMessage(
                msg.chat.id,
                '游戏开始啦，猜测目标：\n'
                    + game.hint + '\n\n'
                    + '将根据第一次猜测决定答案长度',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },
        () => {
            // game exist

            return bot.sendMessage(
                msg.chat.id,
                '已经开始啦',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        }
    );
}));

bot.onText(/^\/0a0b(@\w+)?$/, event((msg, match) => {
    gameplay.end(
        msg.chat.id,
        (game) => {
            // game end

            gameEnd(game);

            if (game.answer) {
                return bot.sendMessage(
                    msg.chat.id,
                    gameInfo(game) + '\n\n'
                        + '游戏结束啦，答案是：\n'
                        + game.answer,
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            } else {
                return bot.sendMessage(
                    msg.chat.id,
                    '游戏结束啦',
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            }
        },
        () => {
            // game not exist

            return bot.sendMessage(
                msg.chat.id,
                '不存在的！',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        }
    );
}));

bot.on('inline_query', (query) => {
    if (config.ban[query.from.id]) {
        return bot.answerInlineQuery(query.id, [{
            type: 'article',
            id: 'banned',
            title: '喵a喵b',
            input_message_content: {
                message_text: '该用户因存在恶意使用 bot 的报告，已被列入黑名单',
            },
        }], {
            cache_time: 0,
            is_personal: true,
        });
    }

    return bot.answerInlineQuery(query.id, [{
        type: 'article',
        id: 'playmeow',
        title: '喵a喵b',
        input_message_content: {
            message_text: '喵喵模式已装载！\n\n'
                + '@' + (query.from.username || query.first_name) + '\n'
                + '/1a2b 开始新游戏',
        },
    }], {
        cache_time: 0,
        is_personal: true,
    });
});

bot.on('chosen_inline_result', (chosen) => {
    console.log('[' + Date() + '] ' + chosen.from.id + '@' + (chosen.from.username || '') + ' ' + chosen.result_id + ' ' + chosen.query);

    if (chosen.result_id === 'playmeow') {
        gameplay.meowInit(chosen.from.id, chosen.query);
    }
});
