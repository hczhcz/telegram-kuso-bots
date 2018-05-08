'use strict';

const fs = require('fs');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.sokobanToken);

const level = require('./sokoban.level');
const gameplay = require('./sokoban.gameplay');

const fd = fs.openSync('log_sokoban', 'a');

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

    const matrix = [];

    for (let i = 0; i < Math.min(game.map.length, 12); i += 1) {
        matrix.push([]);

        for (let j = 0; j < Math.min(game.map[i].length, 8); j += 1) {
            matrix[i].push({
                text: {
                    '#': '\u2588',
                    ' ': ' ',
                    '.': '[ ]',
                    '@': '@',
                    '+': '[@]',
                    '$': '$',
                    '*': '[$]', // TODO
                }[
                    game.map[i][j] // TODO: camera
                ],
                callback_data: JSON.stringify([i, j]),
            });
        }
    }

    if (!win && game.history.length) {
        matrix.push([{
            text: '撤销',
            callback_data: 'undo',
        }]);
    }

    bot.editMessageReplyMarkup(
        {
            inline_keyboard: matrix,
        },
        {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
            reply_to_message_id: msg.reply_to_message.message_id,
        }
    ).finally(() => {
        setTimeout(() => {
            game.update();
        }, config.sokobanUpdateDelay);
    });
};

bot.onText(/^\/sokoban(@\w+)?(?: (\w+)(?: (\d+))?)?$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        '仓库play什么的最棒了！',
        {
            reply_to_message_id: msg.message_id,
        }
    ).then((sentmsg) => {
        gameplay.init(
            sentmsg.chat.id + '_' + sentmsg.message_id,
            [
                '########',
                '# ..#  #',
                '# ..# $###',
                '#  ##    #',
                '## $   $ #',
                ' # ##  ###',
                ' #   $##',
                ' ###  #',
                '   #@ #',
                '   ####',
            ], // TODO: sample level
            (game) => {
                // game init

                messageUpdate(
                    sentmsg,
                    game,
                    false
                );
            },
            () => {
                // game exist

                // never reach
                throw Error(JSON.stringify(sentmsg));
            }
        );
    });
}));

bot.on('callback_query', (query) => {
    const msg = query.message;
    const info = JSON.parse(query.data);

    if (typeof info[0] !== 'number' || typeof info[1] !== 'number') {
        throw Error(JSON.stringify(query));
    }

    log(
        msg.chat.id + '_' + msg.message_id + ':callback:' + query.from.id + '@' + (query.from.username || ''),
        info[0] + ' ' + info[1]
    );

    gameplay.click(
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

            bot.answerCallbackQuery(query.id).catch((err) => {});
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

            bot.answerCallbackQuery(query.id).catch((err) => {});
        },
        (game) => {
            // not changed

            bot.answerCallbackQuery(query.id).catch((err) => {});
        },
        () => {
            // game not exist

            bot.answerCallbackQuery(query.id).catch((err) => {});
        }
    );
});
