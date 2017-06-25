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

        extend: (msg, num) => {
            const game = games[msg.chat.id];

            game.time -= num;
            if (game.time < -600) {
                game.time = -600;
            }
            if (game.time > 0) {
                game.time = 0;
            }

            bot.sendMessage(
                msg.chat.id,
                '续命成功！'
                    + '剩余 ' + (-game.time) + ' 秒 /join'
            );
        },
    };
};
