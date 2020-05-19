'use strict';

const fs = require('fs');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.nonogramToken);

const play = require('./nonogram.play');

const fd = fs.openSync('log_nonogram', 'a');

const log = (head, body) => {
    fs.write(fd, '[' + Date() + '] ' + head + ' ' + body + '\n', () => {
        // nothing
    });
};

const event = (handler, atIndex) => {
    return (msg, match) => {
        if (!match[atIndex] || match[atIndex] === '@' + config.nonogramUsername) {
            log(
                msg.chat.id + ':' + msg.from.id + '@' + (msg.from.username || ''),
                match[0]
            );

            if (!config.ban[msg.from.id]) {
                handler(msg, match);
            }
        }
    };
};

const messageUpdate = (msg, game) => {
    if (game.update) {
        game.update = () => {
            messageUpdate(msg, game);
        };

        return;
    }

    game.update = () => {
        // nothing
    };

    setTimeout(() => {
        game.update();

        delete game.update;
    }, config.nonogramUpdateDelay);

    const matrix = [];

    for (let i = 0; i <= game.rows; i += 1) {
        matrix.push([]);

        for (let j = 0; j <= game.columns; j += 1) {
            if (i === 0 || j === 0) {
                let hint = '';

                for (const k in game.map[i][j]) {
                    if (hint !== '') {
                        hint += ' ';
                    }

                    hint += game.map[i][j][k];
                }

                matrix[i].push({
                    text: hint || '\ud83d\udc30',
                    callback_data: '-',
                });
            } else {
                matrix[i].push({
                    text: {
                        's': ' ',
                        ' ': '\u274c',
                        'b': ' ',
                        '*': '\u2b1b',
                    }[game.map[i][j]],
                    callback_data: JSON.stringify([i, j]),
                });
            }
        }
    }

    bot.editMessageReplyMarkup(
        {
            inline_keyboard: matrix,
        },
        {
            chat_id: msg.chat.id,
            message_id: msg.message_id,
        }
    );
};

const gameStat = (msg, game, title, last) => {
    let totCorrect = 0;
    let totError = 0;

    for (const i in game.history) {
        if (game.history[i][3]) {
            totCorrect += 1;
        } else {
            totError += 1;
        }
    }

    let text = title + '\n\n'
        + '正确 ' + totCorrect + ' / 错误 ' + totError + '\n'
        + '空格消耗率 ' + (Math.round(100 * totError / (game.rows * game.columns - totCorrect)) | 0) + '%\n\n'
        + '统计：\n';

    const stat = {};

    for (const i in game.history) {
        stat[game.history[i][0]] = stat[game.history[i][0]] || [0, 0];

        if (game.history[i][3]) {
            stat[game.history[i][0]][1] += 1;
        } else {
            stat[game.history[i][0]][0] += 1;
        }
    }

    for (const i in stat) {
        text += game.nameMap()[i] + ' - 正确 ' + stat[i][1] + ' / 错误 ' + stat[i][0] + '\n';
    }

    text += '\n'
        + game.nameMap()[game.history[game.history.length - 1][0]] + ' ' + last + '\n\n'
        + '/nono@' + config.nonogramUsername + ' 开始新游戏';

    bot.sendMessage(
        msg.chat.id,
        text,
        {
            reply_to_message_id: msg.message_id,
        }
    );
};

bot.onText(/^\/nono(@\w+)?(?: (\d+) (\d+) (\d+))?$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        '快来打开人家哟～',
        {
            reply_to_message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: [[{
                    text: '...',
                    callback_data: '-',
                }]],
            },
        }
    ).then((sentmsg) => {
        play.init(
            sentmsg.chat.id + '_' + sentmsg.message_id,
            parseInt(match[2], 10) || 7,
            parseInt(match[3], 10) || 7,
            parseInt(match[4], 10) || 24,
            (game) => {
                // game init

                const nameMap = {};

                game.nameMap = () => {
                    return nameMap;
                };

                game.nameMap()[msg.from.id] = msg.from.username || msg.from.first_name;

                messageUpdate(
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
}, 1));

bot.onText(/^\/help(@\w+)?$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        '命令列表：\n'
            + '/nono 开始新游戏\n'
            + '/nono <rows> <columns> <boxes> 指定规格开始新游戏\n'
            + '/help 显示帮助\n'
            + '/status 查看 bot 状态'
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

    if (!msg || config.ban[query.from.id] || query.data === '-') {
        return;
    }

    const info = JSON.parse(query.data);

    if (typeof info[0] !== 'number' || typeof info[1] !== 'number') {
        throw Error(JSON.stringify(query));
    }

    log(
        msg.chat.id + '_' + msg.message_id + ':callback:' + query.from.id + '@' + (query.from.username || ''),
        info[0] + ' ' + info[1]
    );

    play.click(
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

            bot.answerCallbackQuery(query.id).catch((err) => {
                // nothing
            });
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

            bot.answerCallbackQuery(query.id).catch((err) => {
                // nothing
            });
        },
        (game) => {
            // not changed

            bot.answerCallbackQuery(query.id).catch((err) => {
                // nothing
            });
        },
        () => {
            // game not exist

            bot.answerCallbackQuery(query.id).catch((err) => {
                // nothing
            });
        }
    );
});
