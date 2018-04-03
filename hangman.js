'use strict';

const fs = require('fs');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.hangmanToken);

const dict = require('./hangman.dict');
const gameplay = require('./hangman.gameplay');

const fd = fs.openSync('log_hangman', 'a');

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

// const messageUpdate = (msg, game) => {
//     const matrix = [];

//     for (let i = 0; i < game.rows; i += 1) {
//         matrix.push([]);

//         for (let j = 0; j < game.columns; j += 1) {
//             matrix[i].push({
//                 text: {
//                     's': '\u2588',
//                     'S': '\u259a',
//                     'm': '\u2588',
//                     'M': '\u259a',
//                     '0': ' ',
//                     '1': '1',
//                     '2': '2',
//                     '3': '3',
//                     '4': '4',
//                     '5': '5',
//                     '6': '6',
//                     '7': '7',
//                     '8': '8',
//                     '*': '*',
//                 }[
//                     game.map
//                         ? game.map[i][j]
//                         : 's'
//                 ],
//                 callback_data: JSON.stringify([i, j]),
//             });
//         }
//     }

//     const updateFunc = () => {
//         game.update = () => {
//             delete game.update;
//         };

//         bot.editMessageText(
//             '路过的大爷～来扫个雷嘛～',
//             {
//                 chat_id: msg.chat.id,
//                 message_id: msg.message_id,
//                 reply_to_message_id: msg.reply_to_message.message_id,
//                 reply_markup: {
//                     inline_keyboard: matrix,
//                 },
//             }
//         ).finally(() => {
//             setTimeout(() => {
//                 game.update();
//             }, config.minesweeperUpdateDelay);
//         });
//     };

//     if (game.update) {
//         game.update = updateFunc;
//     } else {
//         updateFunc();
//     }
// };

// const gameStat = (msg, game, title, last) => {
//     const stat = {};

//     for (const i in game.history) {
//         stat[game.history[i][0]] = stat[game.history[i][0]] + 1 || 1;
//     }

//     let text = title + '\n\n统计：\n';

//     for (const i in stat) {
//         text += game.nameMap()[i] + ' - ' + stat[i] + '项操作\n';
//     }

//     text += '\n' + game.nameMap()[game.history[game.history.length - 1][0]] + ' ' + last;

//     bot.sendMessage(
//         msg.chat.id,
//         text,
//         {
//             reply_to_message_id: msg.message_id,
//         }
//     );
// };

bot.onText(/^\/hang(@\w+)?(?: (\d+) (\d+) (\d+))?$/, event((msg, match) => {
    const lines = [];

    for (const i in config.hangmanDict) {
        const dictInfo = config.hangmanDict[i];

        const line = [];

        line.push({
            text: dictInfo.title,
            callback_data: JSON.stringify(['dict', dictInfo.id, 1000000]), // default limit
        });

        for (const j in dictInfo.limits) {
            line.push({
                text: dictInfo.limits[j],
                callback_data: JSON.stringify(['dict', dictInfo.id, dictInfo.limits[j]]),
            });
        }

        lines.push(line);
    }

    bot.sendMessage(
        msg.chat.id,
        '请选择词典\n\n数字表示的是缩减版哦',
        {
            reply_to_message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: lines,
            },
        }
    );
}));

bot.on('callback_query', (query) => {
    const msg = query.message;
    const info = JSON.parse(query.data);

    if (info[0] === 'dict') {
        log(
            msg.chat.id + '_' + msg.message_id + ':callback:' + query.from.id + '@' + (query.from.username || ''),
            'dict ' + info[1] + ' ' + info[2]
        );

        // gameplay.click(
        //     msg.chat.id + '_' + msg.message_id,
        //     query.from.id,
        //     info[0],
        //     info[1],
        //     (game) => {
        //         // game continue

        //         game.nameMap()[query.from.id] = query.from.username || query.from.first_name;

        //         messageUpdate(
        //             msg,
        //             game
        //         );

        //         bot.answerCallbackQuery(query.id);
        //     },
        //     (game) => {
        //         // game win

        //         game.nameMap()[query.from.id] = query.from.username || query.from.first_name;

        //         fs.write(fd, JSON.stringify(game) + '\n', () => {
        //             // nothing
        //         });

        //         messageUpdate(
        //             msg,
        //             game
        //         );

        //         gameStat(
        //             msg,
        //             game,
        //             '哇所有奇怪的地方都被你打开啦…好羞羞',
        //             '你要对人家负责哟/// ///'
        //         );

        //         bot.answerCallbackQuery(query.id);
        //     },
        //     (game) => {
        //         // game lose

        //         game.nameMap()[query.from.id] = query.from.username || query.from.first_name;

        //         fs.write(fd, JSON.stringify(game) + '\n', () => {
        //             // nothing
        //         });

        //         messageUpdate(
        //             msg,
        //             game
        //         );

        //         gameStat(
        //             msg,
        //             game,
        //             '一道火光之后，你就在天上飞了呢…好奇怪喵',
        //             '是我们中出的叛徒！'
        //         );

        //         bot.answerCallbackQuery(query.id);
        //     },
        //     (game) => {
        //         // not changed

        //         bot.answerCallbackQuery(query.id);
        //     },
        //     () => {
        //         // game not exist

        //         bot.answerCallbackQuery(query.id);
        //     }
        // );
    } else if (info[0] === 'guess') {
        log(
            msg.chat.id + '_' + msg.message_id + ':callback:' + query.from.id + '@' + (query.from.username || ''),
            'guess ' + info[1]
        );
    }
});
