'use strict';

module.exports = (bot, games) => {
    const self = {
        join: (msg) => {
            const game = games[msg.chat.id];

            game.total += 30;

            if (!game.users[msg.from.id]) {
                game.usercount += 1;
                game.users[msg.from.id] = msg.from;

                return bot.sendMessage(
                    msg.chat.id,
                    msg.from.first_name + ' 按捺不住，'
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

                    if (!game.usercount) {
                        game.time = game.total;
                    }

                    return bot.sendMessage(
                        msg.chat.id,
                        msg.from.first_name + ' 拔了出来，'
                            + '离开了' + game.modename
                    );
                }

                return bot.sendMessage(
                    msg.chat.id,
                    msg.from.first_name + ' 拔了出来，'
                        + '然后忍不住又插了进去，'
                        + '回到了' + game.modename
                );
            }
        },

        invite: (msg, player) => {
            const game = games[msg.chat.id];

            if (player) {
                game.total += 30;

                if (!game.users[player.id]) {
                    game.usercount += 1;
                    game.users[player.id] = player;

                    return bot.sendMessage(
                        msg.chat.id,
                        msg.from.first_name + ' 强行推倒了 '
                            + player.first_name
                    );
                }
            }
        },

        smite: (msg, player) => {
            const game = games[msg.chat.id];

            if (player) {
                if (game.users[player.id]) {
                    game.usercount -= 1;
                    delete game.users[player.id];

                    if (!game.usercount) {
                        game.time = game.total;
                    }

                    return bot.sendMessage(
                        msg.chat.id,
                        msg.from.first_name + ' 把 '
                            + player.first_name + ' 踢下了床'
                    );
                }
            } else {
                self.flee(msg);
            }
        },

        extend: (msg, time) => {
            const game = games[msg.chat.id];

            game.total += time;

            if (game.time > game.total) {
                game.total = game.time;
            }

            // TODO: check user
            if (time > 0) {
                return bot.sendMessage(
                    msg.chat.id,
                    msg.from.first_name + ' 用力一挺，'
                        + '棒棒变得更坚硬了'
                );
            }

            return bot.sendMessage(
                msg.chat.id,
                msg.from.first_name + ' 被吓软了'
            );
        },

        orgasm: (msg) => {
            const game = games[msg.chat.id];

            if (game.usercount > 1 && Math.random() < 0.25) {
                return bot.sendMessage(
                    msg.chat.id,
                    msg.from.first_name + ' 强制让大家达到了高潮'
                ).then(() => {
                    game.time = game.total;
                });
            }

            return bot.sendMessage(
                msg.chat.id,
                msg.from.first_name + ' 强制让自己达到了高潮'
            ).then(() => {
                if (game.users[msg.from.id]) {
                    game.usercount -= 1;
                    delete game.users[msg.from.id];

                    if (!game.usercount) {
                        game.time = game.total;
                    }
                }
            });
        },

        tick: (msg) => {
            const game = games[msg.chat.id];

            switch (game.time - game.total) {
                case -8:
                    return bot.sendMessage(
                        msg.chat.id,
                        '啊……快到了'
                    );
                case -6:
                    return bot.sendMessage(
                        msg.chat.id,
                        '啊…'
                    );
                case -4:
                    return bot.sendMessage(
                        msg.chat.id,
                        '啊啊啊……'
                    );
                case -2:
                    return bot.sendMessage(
                        msg.chat.id,
                        '唔哇啊啊啊啊…………'
                    );
                default:
                    // nothing
            }
        },
    };

    return self;
};
