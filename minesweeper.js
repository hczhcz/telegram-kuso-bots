'use strict';

const fs = require('fs');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.minesweeperToken);

const gameplay = require('./minesweeper.gameplay');

const fd = fs.openSync('log_minesweeper', 'a');

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

const messageUpdate = (msg, game) => {
    const matrix = [];

    for (let i = 0; i < game.rows; i += 1) {
        matrix.push([]);

        for (let j = 0; j < game.columns; j += 1) {
            matrix[i].push({
                text: {
                    's': '\u2588',
                    'S': '\u259a',
                    'm': '\u2588',
                    'M': '\u259a',
                    '0': ' ',
                    '1': '1',
                    '2': '2',
                    '3': '3',
                    '4': '4',
                    '5': '5',
                    '6': '6',
                    '7': '7',
                    '8': '8',
                    '*': '*',
                }[
                    game.map
                        ? game.map[i][j]
                        : 's'
                ],
                callback_data: JSON.stringify([i, j]),
            });
        }
    }

    const updateFunc = () => {
        game.update = () => {
            delete game.update;
        };

        bot.editMessageText(
            '路过的大爷～来扫个雷嘛～',
            {
                chat_id: msg.chat.id,
                message_id: msg.message_id,
                reply_to_message_id: msg.reply_to_message.message_id,
                reply_markup: {
                    inline_keyboard: matrix,
                },
            }
        ).finally(() => {
            setTimeout(() => {
                game.update();
            }, config.minesweeperUpdateDelay);
        });
    };

    if (game.update) {
        game.update = updateFunc;
    } else {
        updateFunc();
    }
};

const gameStat = (msg, game, title, last) => {
    const stat = {};

    for (const i in game.history) {
        stat[game.history[i][0]] = stat[game.history[i][0]] + 1 || 1;
    }

    let text = title + '\n\n统计：\n';

    for (const i in stat) {
        text += game.nameMap()[i] + ' - ' + stat[i] + '项操作\n';
    }

    text += '\n' + game.nameMap()[game.history[game.history.length - 1][0]] + ' ' + last;

    bot.sendMessage(
        msg.chat.id,
        text,
        {
            reply_to_message_id: msg.message_id,
        }
    );
};

bot.onText(/^\/mine(@\w+)?(?: (\d+) (\d+) (\d+))?$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        '一大波地雷正在赶来……',
        {
            reply_to_message_id: msg.message_id,
        }
    ).then((sentmsg) => {
        gameplay.init(
            sentmsg.chat.id + '_' + sentmsg.message_id,
            parseInt(match[2], 10) || 8,
            parseInt(match[3], 10) || 8,
            parseInt(match[4], 10) || 9,
            (game) => {
                // game init

                const nameMap = {};

                game.nameMap = () => {
                    return nameMap;
                };

                game.nameMap()[msg.from.id] = msg.from.username || msg.from.first_name;

                return messageUpdate(
                    sentmsg,
                    game
                );
            },
            () => {
                // not valid

                bot.editMessageText(
                    '不…这样的参数…不可以…',
                    {
                        chat_id: sentmsg.chat.id,
                        message_id: sentmsg.message_id,
                        reply_to_message_id: msg.message_id,
                    }
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

            game.nameMap()[query.from.id] = query.from.username || query.from.first_name;

            messageUpdate(
                msg,
                game
            );

            bot.answerCallbackQuery(query.id);
        },
        (game) => {
            // game win

            game.nameMap()[query.from.id] = query.from.username || query.from.first_name;

            fs.write(fd, JSON.stringify(game) + '\n', () => {
                // nothing
            });

            messageUpdate(
                msg,
                game
            );

            gameStat(
                msg,
                game,
                '哇所有奇怪的地方都被你打开啦…好羞羞',
                '你要对人家负责哟/// ///'
            );

            bot.answerCallbackQuery(query.id);
        },
        (game) => {
            // game lose

            game.nameMap()[query.from.id] = query.from.username || query.from.first_name;

            fs.write(fd, JSON.stringify(game) + '\n', () => {
                // nothing
            });

            messageUpdate(
                msg,
                game
            );

            gameStat(
                msg,
                game,
                '一道火光之后，你就在天上飞了呢…好奇怪喵',
                '是我们中出的叛徒！'
            );

            bot.answerCallbackQuery(query.id);
        },
        (game) => {
            // not changed

            bot.answerCallbackQuery(query.id);
        },
        () => {
            // game not exist

            bot.answerCallbackQuery(query.id);
        }
    );
});
