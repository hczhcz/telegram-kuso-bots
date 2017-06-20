'use strict';

const fs = require('fs');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.threesomeToken);

process.on('uncaughtException', (err) => {
    console.error(err);
});

// TODO: from config?
const fdActions = fs.openSync('./log.actions', 'a');
const fdCommands = fs.openSync('./log.commands', 'a');

const games = {};
const commands = {};

(() => {
    // TODO: from config?
    const commandLog = JSON.parse('[' + fs.readFileSync('./log.commands') + '{}]');

    for (const i in commandLog) {
        if (i < commandLog.length - 1) {
            const entry = commandLog[i];

            commands[entry.chat.id] = commands[entry.chat.id] || {};

            const command = commands[entry.chat.id];

            command[entry.key] = command[entry.key] || [];
            command[entry.key].push(entry.value);
        }
    }
})();

const event = (handler) => {
    return (msg, match) => {
        console.log('[' + Date() + '] ' + msg.chat.id + ':' + msg.from.id + ' ' + match[0]);

        fs.write(fdActions, JSON.stringify({
            msg: msg,
            match: match,
        }) + ',\n', () => {});

        if (config.threesomeBan[msg.from.id]) {
            bot.sendMessage(
                msg.chat.id,
                '妈的 JB 都没你啪个毛',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        } else {
            handler(msg, match);
        }
    };
};

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

const start = (i) => {
    const game = games[i];

    console.log(i + ':')
    console.log(game);

    fs.write(fdActions, JSON.stringify({
        // mock object
        msg: {
            date: Date.now(),
            chat: {
                id: i,
            },
        },
        game: game,
    }) + ',\n', () => {});

    bot.sendMessage(
        i,
        '开始啪啪啦！啪啪啪啪啪啪啪啪'
    );
};

const finish = (i) => {
    const game = games[i];

    bot.sendMessage(
        i,
        '啪啪结束'
    );

    delete games[i];
};

const cancel = (i) => {
    const game = games[i];

    bot.sendMessage(
        i,
        '禽兽人数不足，已取消' + game.modename
    );

    delete games[i];
};

const na = (msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        '目前没有床上运动进行中，\n'
            + '/startmasturbate 启动一场撸管\n'
            + '/startsex 启动一场啪啪\n'
            + '/startthreesome 启动 3P 模式\n'
            + '/startgroupsex 启动 群P 模式\n'
            + '/start100kills 启动 百人斩 模式',
        {
            reply_to_message_id: msg.message_id,
        }
    );
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
            time: -120,
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
            time: -180,
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

bot.onText(/^\/startgroupsex/, event((msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.time <= 0) {
            join(msg, match);
        }
    } else {
        games[msg.chat.id] = {
            usercount: 0,
            users: {},
            modename: '这场群P',
            modemin: 3,
            modemax: 100,
            time: -300,
        };

        bot.sendMessage(
            msg.chat.id,
            '在 ' + (msg.from.first_name || '') + ' 的带领下，'
                + '群P 模式正式启动！'
                + '输入 /join，群里的禽兽们将会全面进场！',
            {
                reply_to_message_id: msg.message_id,
            }
        ).then(() => {
            join(msg, match);
        });
    }
}));

bot.onText(/^\/start100kills/, event((msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.time <= 0) {
            join(msg, match);
        }
    } else {
        games[msg.chat.id] = {
            usercount: 0,
            users: {},
            modename: '百人斩',
            modemin: 100,
            modemax: 100,
            time: -300,
        };

        bot.sendMessage(
            msg.chat.id,
            '在 ' + (msg.from.first_name || '') + ' 的带领下，'
                + '百人斩模式正式启动！'
                + '输入 /join，成为这场豪华盛宴的百分之一！',
            {
                reply_to_message_id: msg.message_id,
            }
        ).then(() => {
            join(msg, match);
        });
    }
}));

bot.onText(/^\/extend[^ ]*( ([+\-]?\d+)\w*)?$/, event((msg, match) => {
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
            if (!game.users[msg.from.id]) {
                game.usercount += 1;
                game.users[msg.from.id] = true;

                bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 按捺不住，'
                        + '强行插入了' + game.modename
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
            if (game.users[msg.from.id]) {
                if (Math.random() < 0.5) {
                    game.usercount -= 1;
                    delete game.users[msg.from.id];

                    bot.sendMessage(
                        msg.chat.id,
                        (msg.from.first_name || msg.from.last_name) + ' 拔了出来，'
                            + '离开了' + game.modename
                    );
                } else {
                    bot.sendMessage(
                        msg.chat.id,
                        (msg.from.first_name || msg.from.last_name) + ' 拔了出来，'
                            + '然后忍不住又插了进去，'
                            + '回到了' + game.modename
                    );
                }
            }
        }
    } else {
        na(msg, match);
    }
}));

bot.onText(/^\/smite[^ ]*( @?(\w+))?$/, event((msg, match) => {
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

bot.onText(/^\/forcefallback/, event((msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.time <= 0) {
            game.time = 0;
        }

        if (game.usercount < game.modemin) {
            switch (game.usercount) {
                case 3:
                    game.modename = '这场 3P';

                    bot.sendMessage(
                        msg.chat.id,
                        '来一发 3P 就不用担心三缺一啦'
                    );

                    break;
                case 2:
                    game.modename = '滚床单活动';

                    bot.sendMessage(
                        msg.chat.id,
                        '两个人相视一笑，来制造生命的大和谐'
                    );

                    break;
                case 1:
                    game.modename = '撸管';

                    bot.sendMessage(
                        msg.chat.id,
                        '还是自己撸一发吧'
                    );

                    break;
                case 0:

                    break;
                default:
                    game.modename = '这场群P';

                    bot.sendMessage(
                        msg.chat.id,
                        '其实，' + game.usercount + 'P 也是可以的嘛'
                    );
            }

            game.modemin = game.usercount;
        }
    } else {
        na(msg, match);
    }
}));

bot.onText(/^\/forceorgasm/, event((msg, match) => {
    if (games[msg.chat.id]) {
        const game = games[msg.chat.id];

        if (game.time > 0) {
            if (game.usercount > 1 && Math.random() < 0.25) {
                bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 强制让大家达到了高潮'
                ).then(() => {
                    game.time = game.total;
                });
            } else {
                bot.sendMessage(
                    msg.chat.id,
                    (msg.from.first_name || msg.from.last_name) + ' 强制让自己达到了高潮'
                ).then(() => {
                    game.usercount -= 1;
                    delete game.users[msg.from.id];
                });
            }
        }
    } else {
        na(msg, match);
    }
}));

bot.onText(/^\/list[^ ]*( ((?!_)\w+))?$/, event((msg, match) => {
    commands[msg.chat.id] = commands[msg.chat.id] || {};

    const command = commands[msg.chat.id];

    if (match[2]) {
        command[match[2]] = command[match[2]] || [];

        let text = '';

        for (const i in command[match[2]]) {
            text += command[match[2]][i] + '\n';
        }

        bot.sendMessage(
            msg.chat.id,
            text,
            {
                reply_to_message_id: msg.message_id,
            }
        );
    } else {
        let text = '';

        for (const i in command) {
            text += i;
        }

        bot.sendMessage(
            msg.chat.id,
            text,
            {
                reply_to_message_id: msg.message_id,
            }
        );
    }
}));

bot.onText(/^\/add[^ ]* ((?!_)\w+)@([^\r\n]+)$/, event((msg, match) => {
    commands[msg.chat.id] = commands[msg.chat.id] || {};

    const command = commands[msg.chat.id];

    command[match[1]] = command[match[1]] || [];
    command[match[1]].push(match[2]);
    fs.write(fdCommands, JSON.stringify({
        chat: {
            id: msg.chat.id,
        },
        key: match[1],
        value: match[2],
    }) + ',\n', () => {});

    bot.sendMessage(
        msg.chat.id,
        '已加入 ' + match[1] + ' 套餐！',
        {
            reply_to_message_id: msg.message_id,
        }
    );
}));

bot.onText(/^\/((?!_)\w+)[^ ]*( (.+))?( (.+))?( (.+))?$/, (msg, match) => {
    if (games[msg.chat.id]) {
        commands[msg.chat.id] = commands[msg.chat.id] || {};

        const command = commands[msg.chat.id];

        let tot = [];

        for (const i in command) {
            if (match[1] === i) {
                for (const j in command[i]) {
                    tot.push(command[i][j]);
                }
            }
        }

        if (tot.length > 0) {
            bot.sendMessage(
                msg.chat.id,
                tot[Math.floor(Math.random() * tot.length)]
            );
        }
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
                if (game.usercount >= game.modemin) {
                    start(i);
                } else {
                    cancel(i);
                }

                game.total = 120 + game.usercount * 60;

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
                finish(i);

                break;
        }

        game.time += 1;
    }
}, 490);
