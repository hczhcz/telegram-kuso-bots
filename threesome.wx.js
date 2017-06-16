'use strict';

// ======== WeChat bot begin ========

const Wechat = require('wechat4u');
const qrcode = require('qrcode-terminal');

const bot = new Wechat();

bot.start();

bot.on('uuid', (uuid) => {
    qrcode.generate(
        'https://login.weixin.qq.com/l/' + uuid,
        {
            small: true,
        },
        (qr) => {
            console.warn(qr);
        }
    );
});

bot.onText = (re, event) => {
    bot.on('message', (msg) => {
        if (
            !msg.isSendBySelf
            && msg.MsgType === bot.CONF.MSGTYPE_TEXT
        ) {
            msg.message_id = 0; // mock

            const tgUser = (user) => {
                return {
                    username: bot.contacts[user].getDisplayName(),
                    first_name: bot.contacts[user].getDisplayName(),
                    id: user,
                };
            };

            const tgGroup = (user) => {
                return {
                    username: bot.contacts[user].getDisplayName(),
                    first_name: bot.contacts[user].getDisplayName(),
                    id: user,
                };
            };

            if (msg.FromUserName.slice(0, 2) === '@@') {
                const content = msg.OriginalContent.split(':<br/>');

                msg.from = tgUser(content[0]);
                msg.chat = tgGroup(msg.FromUserName);
                msg.raw = content[1];
            } else {
                msg.from = tgUser(msg.FromUserName);
                msg.chat = tgUser(msg.FromUserName);
                msg.raw = msg.Content;
            }

            const match = msg.raw.match(re);

            if (match) {
                event(msg, match);
            }
        }
    });
};

bot.sendMessage = (user, text, options) => {
    // TODO: callback query

    return bot.sendText(text, user);
};

bot.on('login', () => {
    console.log('login');
});

bot.on('logout', () => {
    console.log('logout');
});

// ======== WeChat bot end ========

// const TelegramBot = require('node-telegram-bot-api');
const token = require('./token');

process.on('uncaughtException', (err) => {
    console.error(err);
});

// const bot = new TelegramBot(token.threesome, {
//     polling: {
//         interval: 1000,
//     },
// });

const games = {};

const join = (msg, match) => {
    const game = games[msg.chat.id];
    console.log(game)

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
    console.log(msg.chat.id + ': ')
    console.log(game);

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
            + '/startthreesome 启动 3P 模式',
        {
            reply_to_message_id: msg.message_id,
        }
    );
};

const event = (handler) => {
    return (msg, match) => {
        console.log('[' + new Date() + '] ' + msg.chat.id + ':' + msg.from.id + ' ' + match[0]);

        if (token.threesomeBan[msg.from.id]) {
            bot.sendMessage(
                '妈的JB都没你啪个毛',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        } else {
            handler(msg, match);
        }
    };
};

bot.onText(/^\/nextsex/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        '我不会通知你的，请洗干净自己来',
        {
            reply_to_message_id: msg.message_id,
        }
    );
}));

bot.onText(/^\/startmasturbate/, event((msg, match) => {
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
}));

bot.onText(/^\/startsex/, event((msg, match) => {
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
}));

bot.onText(/^\/startthreesome/, event((msg, match) => {
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
}));

bot.onText(/^\/extend[^ ]*( +([+\-]?\d+)\w*)?$/, event((msg, match) => {
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
}));

bot.onText(/^\/join/, event((msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.time <= 0) {
            join(msg, match);
        } else {
            // TODO: check user
            if (!game.users[msg.from.id]) {
                // game.users[msg.from.id] = true; // TODO

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
}));

bot.onText(/^\/flee/, event((msg, match) => {
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
}));

bot.onText(/^\/smite[^ ]*( +@?(\w+))?$/, event((msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.time <= 0) {
            // TODO: get user id from message?
            //       if (match[2]) ...
            // flee(msg, match);
        } else {
            // TODO: verify users
            if (match[2]) {
                bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 把 '
                    + match[2] + ' 踢下了床'
                );
            } else {
                bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 忍不住射了出来，'
                    + '离开了'　+ game.modename
                );
            }
        }
    } else {
        na(msg, match);
    }
}));

bot.onText(/^\/forcestart/, event((msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.time <= 0) {
            game.time = 0;
        }
    } else {
        na(msg, match);
    }
}));

bot.onText(/^\/forceorgasm/, event((msg, match) => {
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
}));

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

        switch (game.time - game.total) {
            case -10:
                bot.sendMessage(
                    i,
                    '啊……快到了'
                );

                break;
            case -6:
                bot.sendMessage(
                    i,
                    '啊…'
                );

                break;
            case -4:
                bot.sendMessage(
                    i,
                    '啊啊啊……'
                );

                break;
            case -2:
                bot.sendMessage(
                    i,
                    '唔哇啊啊啊啊…………'
                );

                break;
            case 0:
                // mock object

                finish({
                    chat: {
                        id: i,
                    }
                }, []);

                break;
        }

        game.time += 1;
    }
}, 900);