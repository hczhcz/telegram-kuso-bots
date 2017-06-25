'use strict';

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.threesomeToken);

const data = require('./threesome.data')(config.threesomePathActions, config.threesomePathCommands);

const info = require('./threesome.info')(bot);
const gather = require('./threesome.gather')(bot, data.games);
const init = require('./threesome.init')(bot, data.games);
const play = require('./threesome.play')(bot, data.games);

process.on('uncaughtException', (err) => {
    console.error(err);
});

const event = (handler) => {
    return (msg, match) => {
        console.log('[' + Date() + '] ' + msg.chat.id + ':' + msg.from.id + ' ' + match[0]);

        data.writeMessage(
            msg,
            match
        );

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

const start = (i) => {
    const game = data.games[i];

    console.log(i + ':')
    console.log(game);

    data.writeGame(
        {
            date: Date.now(),
            chat: {
                id: i,
            },
        },
        game
    );

    bot.sendMessage(
        i,
        '开始啪啪啦！啪啪啪啪啪啪啪啪'
    );
};

const finish = (i) => {
    const game = data.games[i];

    bot.sendMessage(
        i,
        '啪啪结束'
    );

    delete data.games[i];
};

const cancel = (i) => {
    const game = data.games[i];

    bot.sendMessage(
        i,
        '禽兽人数不足，已取消' + game.modename
    );

    delete data.games[i];
};

bot.onText(/^\/nextsex/, event((msg, match) => {
    info.next(msg);
}));

bot.onText(/^\/startmasturbate/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time <= 0) {
            gather.join(msg);
        }
    } else {
        init.masturbate(msg).then(() => {
            gather.join(msg);
        });
    }
}));

bot.onText(/^\/startsex/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time <= 0) {
            gather.join(msg);
        }
    } else {
        init.sex(msg).then(() => {
            gather.join(msg);
        });
    }
}));

bot.onText(/^\/startthreesome/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time <= 0) {
            gather.join(msg);
        }
    } else {
        init.threesome(msg).then(() => {
            gather.join(msg);
        });
    }
}));

bot.onText(/^\/startgroupsex/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time <= 0) {
            gather.join(msg);
        }
    } else {
        init.groupsex(msg).then(() => {
            gather.join(msg);
        });
    }
}));

bot.onText(/^\/start100kills/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time <= 0) {
            gather.join(msg);
        }
    } else {
        init.kills(msg).then(() => {
            gather.join(msg);
        });
    }
}));

bot.onText(/^\/extend[^ ]*( ([+\-]?\d+)\w*)?$/, event((msg, match) => {
    let time = parseInt(match[2] || '30', 10);

    if (time > 300) {
        time = 300;
    }
    if (time < -300) {
        time = -300;
    }

    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time <= 0) {
            gather.extend(msg, time);
        } else {
            play.extend(msg, time);
        }
    } else {
        info.na(msg);
    }
}));

bot.onText(/^\/join/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time <= 0) {
            gather.join(msg);
        } else {
            play.join(msg);
        }
    } else {
        info.na(msg);
    }
}));

bot.onText(/^\/flee/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time <= 0) {
            gather.flee(msg);
        } else {
            play.flee(msg);
        }
    } else {
        info.na(msg);
    }
}));

bot.onText(/^\/smite[^ ]*( @?(\w+))?$/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time <= 0) {
            // TODO: get user id from message?
            //       if (match[2]) ...
            // gather.flee(msg);
        } else {
            play.smite(msg, match[2]);
        }
    } else {
        info.na(msg);
    }
}));

bot.onText(/^\/forcestart/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time <= 0) {
            gather.start(msg);
        }
    } else {
        info.na(msg);
    }
}));

bot.onText(/^\/forcefallback/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time <= 0) {
            gather.fallback(msg);
        }
    } else {
        info.na(msg);
    }
}));

bot.onText(/^\/forceorgasm/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time > 0) {
            play.orgasm(msg);
        }
    } else {
        info.na(msg);
    }
}));

bot.onText(/^\/list[^ ]*( ((?!_)\w+))?$/, event((msg, match) => {
    data.commands[msg.chat.id] = data.commands[msg.chat.id] || {};

    const command = data.commands[msg.chat.id];

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
            text += i + '\n';
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
    data.commands[msg.chat.id] = data.commands[msg.chat.id] || {};

    const command = data.commands[msg.chat.id];

    command[match[1]] = command[match[1]] || [];
    command[match[1]].push(match[2]);
    data.writeCommand(
        {
            id: msg.chat.id,
        },
        match[1],
        match[2]
    );

    bot.sendMessage(
        msg.chat.id,
        '已加入 ' + match[1] + ' 套餐！',
        {
            reply_to_message_id: msg.message_id,
        }
    );
}));

bot.onText(/^\/((?!_)\w+)[^ ]*( ([^\r\n ]+))?( ([^\r\n ]+))?( ([^\r\n ]+))?$/, event((msg, match) => {
    data.commands[msg.chat.id] = data.commands[msg.chat.id] || {};

    const command = data.commands[msg.chat.id];

    let tot = [];

    const i = match[1];

    for (const j in command[i]) {
        let text = '';

        for (let k = 0; k < command[i][j].length; ++k) {
            if (command[i][j][k] == '$') {
                if (command[i][j].slice(k).startsWith('$ME')) {
                    text += msg.from.first_name || msg.from.last_name;
                    k += 2;
                } else if (command[i][j].slice(k).startsWith('$YOU')) {
                    if (msg.reply_to_message) {
                        text += msg.reply_to_message.from.first_name || msg.reply_to_message.from.last_name;
                        k += 3;
                    } else {
                        text = '';
                        break;
                    }
                } else if (command[i][j].slice(k).startsWith('$MODE')) {
                    const game = data.games[msg.chat.id];

                    if (game) {
                        text += game.modename;
                        k += 4;
                    } else {
                        text = '';
                        break;
                    }
                } else if (command[i][j].slice(k).startsWith('$1')) {
                    if (match[3]) {
                        text += match[3] || '';
                        k += 1;
                    } else {
                        text = '';
                        break;
                    }
                } else if (command[i][j].slice(k).startsWith('$2')) {
                    if (match[5]) {
                        text += match[5] || '';
                        k += 1;
                    } else {
                        text = '';
                        break;
                    }
                } else if (command[i][j].slice(k).startsWith('$3')) {
                    if (match[7]) {
                        text += match[7] || '';
                        k += 1;
                    } else {
                        text = '';
                        break;
                    }
                } else {
                    text += command[i][j][k];
                }
            } else {
                text += command[i][j][k];
            }
        }

        if (text) {
            tot.push(text);
        }
    }

    if (tot.length > 0) {
        bot.sendMessage(
            msg.chat.id,
            tot[Math.floor(Math.random() * tot.length)]
        );
    }
}));

setInterval(() => {
    for (const i in data.games) {
        const game = data.games[i];

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

        if (game.time > 0 && game.time - game.total < -10) {
            // TODO
        }

        game.time += 1;
    }
}, 490);
