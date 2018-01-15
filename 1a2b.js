'use strict';

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.abToken);

const core = require('./1a2b.core');

process.on('uncaughtException', (err) => {
    console.error(err);
});

const games = {};

const event = (handler) => {
    return (msg, match) => {
        console.log('[' + Date() + '] ' + msg.chat.id + ':' + msg.from.id + '@' + (msg.from.username || '') + ' ' + match[0]);

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
        + game.charset;

    return info;
};

const gameEnd = (game) => {
    for (const sentmsg of game.msglist) {
        bot.deleteMessage(sentmsg.chat.id, sentmsg.message_id);
    }
    delete game.msglist;

    console.log(JSON.stringify(games[msg.chat.id]));
    delete games[msg.chat.id];
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

        if (game.guess['#' + match[0]][0] === core.length(game.answer)) {
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

bot.onText(/^[^\n\r\t ]+$/, (msg, match) => {
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

bot.onText(/^\/1a2b(@\w+)?(?: ([^\n\r\t ]+))?$/, event((msg, match) => {
    if (games[msg.chat.id]) {
        return bot.sendMessage(
            msg.chat.id,
            '已经开始啦',
            {
                reply_to_message_id: msg.message_id,
            }
        );
    } else {
        let charset = match[2];

        if (!charset && msg.reply_to_message && msg.reply_to_message.text.match(/^[^\n\r\t ]+$/)) {
            charset = msg.reply_to_message.text;
        }

        if (!charset) {
            charset = '1234567890';
        }

        const game = games[msg.chat.id] = {
            charset: charset,
            answer: null,
            guess: {},
            msglist: [],
        };

        return bot.sendMessage(
            msg.chat.id,
            '游戏开始啦，猜测目标：\n'
                + game.charset + '\n\n'
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
