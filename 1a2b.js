'use strict';

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.abToken);

const core = require('./1a2b.core');

process.on('uncaughtException', (err) => {
    console.error(err);
});

const games = {};
const meow = {};

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

    for (const text in game.guess) {
        info += text.slice(1) + ' ' + game.guess[text][0] + 'A' + game.guess[text][1] + 'B\n';
        total += 1;
    }

    info += '（总共' + total + '次）\n\n'
        + '猜测目标：\n'
        + (game.hint || game.charset);

    return info;
};

const gameEnd = (game) => {
    delete game.hint;

    for (const sentmsg of game.msglist) {
        bot.deleteMessage(sentmsg.chat.id, sentmsg.message_id);
    }
    delete game.msglist;

    console.log(JSON.stringify(game));
};

const gameEvent = event((msg, match) => {
    const game = games[msg.chat.id];

    if (game.guess['#' + match[0]]) {
        return bot.sendMessage(
            msg.chat.id,
            '已经猜过啦',
            {
                reply_to_message_id: msg.message_id,
            }
        );
    } else {
        game.guess['#' + match[0]] = core.getAB(match[0], game.answer);
        game.hint = core.reveal(match[0], game.hint, game.charset);

        if (game.guess['#' + match[0]][0] === core.length(game.answer)) {
            gameEnd(game);
            delete games[msg.chat.id];

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
        } else {
            return bot.sendMessage(
                msg.chat.id,
                gameInfo(game),
                {
                    reply_to_message_id: msg.message_id,
                }
            ).then((sentmsg) => {
                if (game.msglist) {
                    game.msglist.push(sentmsg);
                } else {
                    bot.deleteMessage(sentmsg.chat.id, sentmsg.message_id);
                }
            });
        }
    }
});

bot.onText(/^[^\n\r\s]+$/, (msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.answer) {
            if (core.length(match[0]) === core.length(game.answer) && !core.extraChar(match[0], game.charset)) {
                gameEvent(msg, match);
            }
        } else {
            if (core.length(match[0]) <= config.abMaxLength && !core.extraChar(match[0], game.charset)) {
                game.answer = core.shuffle(game.charset, core.length(match[0]));
                gameEvent(msg, match);
            }
        }
    }
});

bot.onText(/^\/1a2b(@\w+)?(?: ([^\n\r]+))?$/, event((msg, match) => {
    if (games[msg.chat.id]) {
        return bot.sendMessage(
            msg.chat.id,
            '已经开始啦',
            {
                reply_to_message_id: msg.message_id,
            }
        );
    } else {
        // charset selection order: argument -> reply -> meow -> default

        let charset = null;
        let hint = null;

        const ok = () => {
            return charset && core.length(charset) <= config.abMaxCharsetLength;
        };

        if (match[2]) {
            charset = match[2].split(/\s+/).join('');
            hint = charset;
        }

        if (!ok() && msg.reply_to_message && msg.reply_to_message.text) {
            const arr = msg.reply_to_message.text.split(/[\n\r]+/);

            arr.filter((str, i, self) => {
                return str && self.indexOf(str) === i;
            });

            if (arr.length) {
                if (arr.length > 1) {
                    charset = arr[Math.floor(Math.random() * arr.length)].split(/\s+/).join('');
                    hint = '喵'.repeat(charset.length);
                } else {
                    charset = arr[Math.floor(Math.random() * arr.length)].split(/\s+/).join('');
                    hint = charset;
                }
            }
        }

        if (!ok() && meow[msg.from.id]) {
            charset = meow[msg.from.id];
            hint = '喵'.repeat(charset.length);
            delete meow[msg.from.id];
        }

        if (!ok()) {
            charset = '1234567890';
            hint = charset;
        }

        const game = games[msg.chat.id] = {
            charset: charset,
            answer: null,
            guess: {},
            hint: hint,
            msglist: [],
        };

        return bot.sendMessage(
            msg.chat.id,
            '游戏开始啦，猜测目标：\n'
                + game.hint + '\n\n'
                + '将根据第一次猜测决定答案长度',
            {
                reply_to_message_id: msg.message_id,
            }
        );
    }
}));

bot.onText(/^\/0a0b(@\w+)?$/, event((msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        gameEnd(game);
        delete games[msg.chat.id];

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
    } else {
        return bot.sendMessage(
            msg.chat.id,
            '不存在的！',
            {
                reply_to_message_id: msg.message_id,
            }
        );
    }
}));

bot.on('inline_query', (query) => {
    if (query.query.match(/^[^\n\r]+$/)) {
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
    } else {
        return bot.answerInlineQuery(query.id, [], {
            cache_time: 0,
            is_personal: true,
        });
    }
});

bot.on('chosen_inline_result', (chosen) => {
    console.log('[' + Date() + '] ' + chosen.from.id + '@' + (chosen.from.username || '') + ' ' + chosen.result_id + ' ' + chosen.query);

    if (chosen.result_id === 'playmeow') {
        meow[chosen.from.id] = chosen.query.split(/\s+/).join('');
    }
});
