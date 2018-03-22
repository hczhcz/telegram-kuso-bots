'use strict';

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.minesweeperToken);

const gameplay = require('./minesweeper.gameplay');

const event = (handler) => {
    return (msg, match) => {
        console.log('[' + Date() + '] ' + msg.chat.id + ':' + msg.from.id + '@' + (msg.from.username || '') + ' ' + match[0]);

        if (!config.ban[msg.from.id]) {
            handler(msg, match);
        }
    };
};

const messageUpdate = (game, text, info) => {
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
                callback_data: JSON.stringify({
                    chat_id: info.chat_id,
                    message_id: info.message_id,
                    i: i,
                    j: j,
                }),
            });
        }
    }

    return bot.editMessageText(
        text,
        {
            chat_id: info.chat_id,
            message_id: info.message_id,
            reply_markup: {
                inline_keyboard: matrix,
            },
        }
    );
};

bot.onText(/^\/mine(@\w+)?(?: (\d+) (\d+) (\d+))?$/, event((msg, match) => {
    return bot.sendMessage(
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

                return messageUpdate(
                    game,
                    '路过的大爷～来扫个雷嘛～',
                    {
                        chat_id: sentmsg.chat.id,
                        message_id: sentmsg.message_id,
                    }
                );
            },
            () => {
                // game exist

                // never reach
                throw Error(sentmsg);
            },
            () => {
                // not valid

                return bot.editMessageText(
                    '不…这样的参数…不可以…',
                    {
                        chat_id: sentmsg.chat.id,
                        message_id: sentmsg.message_id,
                        reply_to_message_id: msg.message_id,
                    }
                );
            }
        );
    });
}));

bot.on('callback_query', (query) => {
    const info = JSON.parse(query.data);

    console.log('[' + Date() + '] ' + info.chat_id + ':callback:' + query.from.id + '@' + (query.from.username || '') + ' ' + info.i + ' ' + info.j);

    gameplay.click(
        info.chat_id + '_' + info.message_id,
        query.from.id,
        info.i,
        info.j,
        (game) => {
            // game continue

            return messageUpdate(
                game,
                '路过的大爷～来扫个雷嘛～',
                info
            );
        },
        (game) => {
            // game win

            console.log(JSON.stringify(game));

            return messageUpdate(
                game,
                '哇所有奇怪的地方都被你看了个遍啦…好羞羞',
                info
            );
        },
        (game) => {
            // game lose

            console.log(JSON.stringify(game));

            return messageUpdate(
                game,
                '一道火光之后，你就在天上飞了呢…好奇怪喵',
                info
            );
        },
        (game) => {
            // not changed
        },
        () => {
            // game not exist
        }
    );
});