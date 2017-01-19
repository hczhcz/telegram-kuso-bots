'use strict';

const TelegramBot = require('node-telegram-bot-api');
const token = require('./token').threesome;

process.on('uncaughtException', (err) => {
    console.err(err);
});

const bot = new TelegramBot(token, {
    polling: {
        interval: 1000,
    },
});

const games = {};

const join = (msg, match) => {
    const game = games[msg.chat.id];

    if (!game.users[msg.from.id] && game.usercount < game.modemax) {
        game.usercount += 1;
        game.users[msg.from.id] = true;

        if (game.time > -60) {
            game.time = -60;
        }

        bot.sendMessage(
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
};

const flee = (msg, match) => {
    const game = games[msg.chat.id];

    if (game.users[msg.from.id]) {
        game.usercount -= 1;
        delete game.users[msg.from.id];

        if (game.time > -30) {
            game.time = -30;
        }

        bot.sendMessage(
            msg.chat.id,
            (msg.from.first_name || msg.from.last_name) + ' 逃离了' + game.modename + '，'
                + '不再与大家啪啪\n\n'
                + '剩余 ' + game.usercount + ' 人'
        );
    }
};

const start = (msg, match) => {
    const game = games[msg.chat.id];
    console.log(msg.chat.id + ': ' + game);

    bot.sendMessage(
        msg.chat.id,
        '开始啪啪啦！啪啪啪啪啪啪啪啪'
    );
};

const finish = (msg, match) => {
    const game = games[msg.chat.id];

    bot.sendMessage(
        msg.chat.id,
        '啪啪结束'
    );

    delete games[msg.chat.id];
};

const cancel = (msg, match) => {
    const game = games[msg.chat.id];

    bot.sendMessage(
        msg.chat.id,
        '禽兽人数不足，已取消' + game.modename
    );

    delete games[msg.chat.id];
};

const na = (msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        '目前没有床上运动进行中，\n'
            + '/startmasturbate 启动一场撸管\n'
            + '/startsex 启动一场啪啪\n'
            + '/startthreesome 启动 3P 模式'
    );
};

bot.onText(/^\/nextsex/, (msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        '我不会通知你的，请洗干净自己来'
    );
});

bot.onText(/^\/startmasturbate/, (msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.time <= 0) {
            join(msg, match);
        }
    } else {
        games[msg.chat.id] = {
            usercount: 0,
            users: {},
            modename: '撸管',
            modemin: 1,
            modemax: 1,
            time: -300,
            total: 60,
        };

        bot.sendMessage(
            msg.chat.id,
            (msg.from.first_name || msg.from.last_name) + ' 决定自己撸一炮！',
            {
                reply_to_message_id: msg.message_id,
            }
        ).then(() => {
            join(msg, match);
        });
    }
});

bot.onText(/^\/startsex/, (msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.time <= 0) {
            join(msg, match);
        }
    } else {
        games[msg.chat.id] = {
            usercount: 0,
            users: {},
            modename: '滚床单活动',
            modemin: 2,
            modemax: 2,
            time: -300,
            total: 90,
        };

        bot.sendMessage(
            msg.chat.id,
            (msg.from.first_name || msg.from.last_name) + ' 已经启动了一场约炮！'
                + '输入指令 /join 来参加这场床单盛宴...'
                + '不排除有怀孕的可能 :P',
            {
                reply_to_message_id: msg.message_id,
            }
        ).then(() => {
            join(msg, match);
        });
    }
});

bot.onText(/^\/startthreesome/, (msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.time <= 0) {
            join(msg, match);
        }
    } else {
        games[msg.chat.id] = {
            usercount: 0,
            users: {},
            modename: '这场 3P',
            modemin: 3,
            modemax: 3,
            time: -300,
            total: 120,
        };

        bot.sendMessage(
            msg.chat.id,
            '在 ' + (msg.from.first_name || '') + ' 的带领下，'
                + '3P 模式正式启动！'
                + '输入 /join，群里的禽兽们将会全面进场！',
            {
                reply_to_message_id: msg.message_id,
            }
        ).then(() => {
            join(msg, match);
        });
    }
});

bot.onText(/^\/extend( +([+\-]?\d+)\w*)?$/, (msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        const num = parseInt(match[2] || '30', 10);

        if (num > 300) {
            num = 300;
        }
        if (num < -300) {
            num = -300;
        }

        if (game.time <= 0) {
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
        } else {
            game.total += num;
            if (game.time < 1) {
                game.time = 1;
            }

            // TODO: check user
            if (num > 0) {
                bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 用力一挺，'
                        + '棒棒变得更坚硬了'
                );
            } else {
                bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 被吓软了'
                );
            }
        }
    } else {
        na(msg, match);
    }
});

bot.onText(/^\/join/, (msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.time <= 0) {
            join(msg, match);
        } else {
            // TODO: check user
            if (!game.users[msg.from.id]) {
                bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 按捺不住，'
                        + '强行插入了这场' + game.modename
                );
            }
        }
    } else {
        na(msg, match);
    }
});

bot.onText(/^\/flee/, (msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.time <= 0) {
            flee(msg, match);
        } else {
            // TODO: check user
            bot.sendMessage(
                msg.chat.id,
                (msg.from.first_name || msg.from.last_name) + ' 拔了出来，'
                    + '然后忍不住又插了进去，'
                    + '回到了' + game.modename
            );
        }
    } else {
        na(msg, match);
    }
});

bot.onText(/^\/smite( +@?(\w+))?$/, (msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.time <= 0) {
            // TODO: get user id from message?
            //       if (match[2]) ...
            // flee(msg, match);
        } else {
            // TODO: verify users
            bot.sendMessage(
                msg.chat.id,
                (msg.from.first_name || msg.from.last_name) + ' 把性伴侣踢下了床'
            );
        }
    } else {
        na(msg, match);
    }
});

bot.onText(/^\/forcestart/, (msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.time <= 0) {
            game.time = 0;
        }
    } else {
        na(msg, match);
    }
});

bot.onText(/^\/forceorgasm/, (msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.time > 0) {
            bot.sendMessage(
                msg.chat.id,
                (msg.from.first_name || msg.from.last_name) + ' 强制让大家达到了高潮'
            ).then(() => {
                game.time = game.total;
            });
        }
    } else {
        na(msg, match);
    }
});

setInterval(() => {
    for (const i in games) {
        const game = games[i];

        switch (game.time) {
            case -60:
                bot.sendMessage(
                    i,
                    '剩余一分钟 /join'
                );

                break;
            case -30:
                bot.sendMessage(
                    i,
                    '剩余 30 秒 /join'
                );

                break;
            case -10:
                bot.sendMessage(
                    i,
                    '剩余 10 秒 /join'
                );

                break;
            case 0:
                // mock objects

                if (game.usercount >= game.modemin) {
                    start({
                        chat: {
                            id: i,
                        }
                    }, []);
                } else {
                    cancel({
                        chat: {
                            id: i,
                        }
                    }, []);
                }

                break;
        }

        if (game.time >= game.total) {
            finish({
                chat: {
                    id: i,
                }
            }, []);
        }

        game.time += 1;
    }
}, 900);
