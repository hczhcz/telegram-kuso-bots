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

const makeMatrix = (chat_id, message_id, game) => {
    const result = [];

    for (let i = 0; i < game.rows; i += 1) {
        result.push([]);

        for (let j = 0; j < game.columns; j += 1) {
            result[i].push({
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
                    chat_id: chat_id,
                    message_id: message_id,
                    targetI: i,
                    targetJ: j,
                }),
            });
        }
    }

    return result;
};

bot.onText(/^\/mine(@\w+)?(?: (\d+) (\d+) (\d+))?$/, event((msg, match) => {
    gameplay.init(
        msg.chat.id + '_' + msg.message_id,
        parseInt(match[2], 10) || 8,
        parseInt(match[3], 10) || 8,
        parseInt(match[4], 10) || 9,
        (game) => {
            // game init

            return bot.sendMessage(
                msg.chat.id,
                '.',
                {
                    reply_to_message_id: msg.message_id,
                    reply_markup: {
                        inline_keyboard: makeMatrix(
                            msg.chat.id,
                            msg.message_id,
                            game
                        ),
                    },
                }
            ).then((sentmsg) => {
                game.update = (text) => {
                    bot.editMessageText(
                        text,
                        {
                            chat_id: sentmsg.chat.id,
                            message_id: sentmsg.message_id,
                            reply_markup: {
                                inline_keyboard: makeMatrix(
                                    msg.chat.id,
                                    msg.message_id,
                                    game
                                ),
                            },
                        }
                    );
                };
            });
        },
        () => {
            // game exist
        },
        () => {
            // not valid
        }
    );
}));

bot.on('callback_query', (query) => {
    const info = JSON.parse(query.data);

    console.log('[' + Date() + '] ' + info.chat_id + ':callback:' + query.from.id + '@' + (query.from.username || '') + ' ' + info.targetI + ' ' + info.targetJ);

    gameplay.click(
        info.chat_id + '_' + info.message_id,
        query.from.id,
        info.targetI,
        info.targetJ,
        (game) => {
            // game continue

            if (game.update) {
                game.update('.');
            }
        },
        (game) => {
            // game win

            if (game.update) {
                game.update('.');
            }
        },
        (game) => {
            // game lose

            if (game.update) {
                game.update('.');
            }
        },
        (game) => {
            // not changed
        },
        () => {
            // game not exist
        }
    );
});
