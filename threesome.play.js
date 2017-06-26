'use strict';

module.exports = (bot, games) => {
    return {
        join: (msg) => {
            const game = games[msg.chat.id];

            game.total += 60;

            if (!game.users[msg.from.id]) {
                game.usercount += 1;
                game.users[msg.from.id] = true;

                return bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 按捺不住，'
                        + '强行插入了' + game.modename
                );
            }
        },

        flee: (msg) => {
            const game = games[msg.chat.id];

            if (game.users[msg.from.id]) {
                if (Math.random() < 0.5) {
                    game.usercount -= 1;
                    delete game.users[msg.from.id];

                    return bot.sendMessage(
                        msg.chat.id,
                        (msg.from.first_name || msg.from.last_name) + ' 拔了出来，'
                            + '离开了' + game.modename
                    );
                } else {
                    return bot.sendMessage(
                        msg.chat.id,
                        (msg.from.first_name || msg.from.last_name) + ' 拔了出来，'
                            + '然后忍不住又插了进去，'
                            + '回到了' + game.modename
                    );
                }
            }
        },

        smite: (msg, player) => {
            const game = games[msg.chat.id];

            // TODO: verify users
            if (player) {
                return bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 把 '
                    + player + ' 踢下了床'
                );
            } else {
                return bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 忍不住射了出来，'
                    + '离开了' + game.modename
                );
            }
        },

        extend: (msg, time) => {
            const game = games[msg.chat.id];

            game.total += time;

            // TODO: check user
            if (time > 0) {
                return bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 用力一挺，'
                        + '棒棒变得更坚硬了'
                );
            } else {
                return bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 被吓软了'
                );
            }
        },

        orgasm: (msg) => {
            const game = games[msg.chat.id];

            if (game.usercount > 1 && Math.random() < 0.25) {
                return bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 强制让大家达到了高潮'
                ).then(() => {
                    game.time = game.total;
                });
            } else {
                return bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 强制让自己达到了高潮'
                ).then(() => {
                    game.usercount -= 1;
                    delete game.users[msg.from.id];
                });
            }
        },
    };
};
