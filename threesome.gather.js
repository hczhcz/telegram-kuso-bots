'use strict';

module.exports = (bot, games) => {
    return {
        join: (msg) => {
            const game = games[msg.chat.id];

            if (!game.users[msg.from.id] && game.usercount < game.modemax) {
                game.usercount += 1;
                game.users[msg.from.id] = true;

                if (game.time > -60) {
                    game.time = -60;
                }

                return bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 加入了' + game.modename + '，'
                        + game.usercount + ' 名禽兽参加，'
                        + '最少 ' + game.modemin + ' 人参加，'
                        + '最多 ' + game.modemax + ' 人参加'
                ).then(() => {
                    if (game.usercount === game.modemax) {
                        game.time = 0;
                    }
                });
            }
        },

        flee: (msg) => {
            const game = games[msg.chat.id];

            if (game.users[msg.from.id]) {
                game.usercount -= 1;
                delete game.users[msg.from.id];

                if (game.time > -30) {
                    game.time = -30;
                }

                return bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 逃离了' + game.modename + '，'
                        + '不再与大家啪啪\n\n'
                        + '剩余 ' + game.usercount + ' 人'
                );
            }
        },

        extend: (msg, time) => {
            const game = games[msg.chat.id];

            game.time -= time;

            if (game.time < -600) {
                game.time = -600;
            }
            if (game.time > 0) {
                game.time = 0;
            }

            return bot.sendMessage(
                msg.chat.id,
                '续命成功！'
                    + '剩余 ' + -game.time + ' 秒 /join'
            );
        },

        start: (msg) => {
            const game = games[msg.chat.id];

            game.time = 0;
        },

        fallback: (msg) => {
            const game = games[msg.chat.id];

            game.time = 0;

            if (game.usercount < game.modemin) {
                switch (game.usercount) {
                    case 3:
                        game.modename = '这场 3P';
                        game.modemin = 3;

                        return bot.sendMessage(
                            msg.chat.id,
                            '来一发 3P 就不用担心三缺一啦'
                        );
                    case 2:
                        game.modename = '滚床单活动';
                        game.modemin = 2;

                        return bot.sendMessage(
                            msg.chat.id,
                            '两个人相视一笑，来制造生命的大和谐'
                        );
                    case 1:
                        game.modename = '撸管';
                        game.modemin = 1;

                        return bot.sendMessage(
                            msg.chat.id,
                            '还是自己撸一发吧'
                        );
                    case 0:
                        break;
                    default:
                        game.modename = '这场群P';
                        game.modemin = 3;

                        return bot.sendMessage(
                            msg.chat.id,
                            '其实，' + game.usercount + 'P 也是可以的嘛'
                        );
                }
            }
        },
    };
};
