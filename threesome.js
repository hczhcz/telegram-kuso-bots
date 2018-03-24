'use strict';

const util = require('util');
const fs = require('fs');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.threesomeToken);

const data = require('./threesome.data')(config.threesomePathActions, config.threesomePathCommands);

const info = require('./threesome.info')(bot);
const gather = require('./threesome.gather')(bot, data.games);
const init = require('./threesome.init')(bot, data.games);
const play = require('./threesome.play')(bot, data.games);
const stat = require('./threesome.stat')(bot, data.stats);
const command = require('./threesome.command')(bot, data.games, data.commands, data.writeCommand);
const inline = require('./threesome.inline')(bot);

const fd = fs.openSync('log', 'a');

const log = (head, body) => {
    fs.write(fd, '[' + Date() + '] ' + head + ' ' + body + '\n', () => {
        // nothing
    });
};

const event = (handler, atIndex) => {
    return (msg, match) => {
        if (!match[atIndex] || match[atIndex] === '@' + config.threesomeUsername) {
            if (!msg.msg_init) {
                log(
                    msg.chat.id + ':' + msg.from.id + '@' + (msg.from.username || ''),
                    match[0]
                );

                data.writeMessage(msg);

                if (config.threesomeChatMap[msg.chat.id]) {
                    msg.chat.mapped = config.threesomeChatMap[msg.chat.id];
                } else {
                    msg.chat.mapped = msg.chat.id;
                }

                msg.msg_init = true;
            }

            // notice: take care of the inline query event
            if (config.ban[msg.from.id]) {
                info.banned(msg);
            } else {
                handler(msg, match);
            }
        }
    };
};

const playerEvent = (msg, handler) => {
    for (const i in msg.entities) {
        switch (msg.entities[i].type) {
            case 'mention':
                // TODO: support all users instead of admins only
                if (msg.chat.type !== 'private') {
                    bot.getChatAdministrators(msg.chat.id).then((members) => {
                        const username = msg.text.slice(
                            msg.entities[i].offset + 1,
                            msg.entities[i].offset + msg.entities[i].length
                        );

                        for (const j in members) {
                            if (members[j].user.username === username) {
                                handler(members[j].user);

                                return;
                            }
                        }
                    });
                }

                return;
            case 'text_mention':
                handler(msg.entities[i].user);

                return;
            default:
                // nothing
        }
    }

    handler(msg.reply_to_message && msg.reply_to_message.from);
};

bot.onText(/^\/nextsex(@\w+)?$/, event((msg, match) => {
    info.next(msg);
}, 1));

bot.onText(/^\/startmasturbate(@\w+)?$/, event((msg, match) => {
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
}, 1));

bot.onText(/^\/startsex(@\w+)?$/, event((msg, match) => {
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
}, 1));

bot.onText(/^\/startthreesome(@\w+)?$/, event((msg, match) => {
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
}, 1));

bot.onText(/^\/startgroupsex(@\w+)?$/, event((msg, match) => {
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
}, 1));

bot.onText(/^\/start100kills(@\w+)?$/, event((msg, match) => {
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
}, 1));

bot.onText(/^\/extend(@\w+)?(?: ([+-]?\d+)\w*)?$/, event((msg, match) => {
    let time = parseInt(match[2] || '30', 10);

    if (time < -300) {
        time = -300;
    } else if (time > 300) {
        time = 300;
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
}, 1));

bot.onText(/^\/join(@\w+)?$/, event((msg, match) => {
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
}, 1));

bot.onText(/^\/flee(@\w+)?$/, event((msg, match) => {
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
}, 1));

bot.onText(/^\/invite(@\w+)?(?: @?\w+)?$/, event((msg, match) => {
    playerEvent(msg, (player) => {
        if (data.games[msg.chat.id]) {
            const game = data.games[msg.chat.id];

            if (game.time <= 0) {
                gather.invite(msg, player);
            } else {
                play.invite(msg, player);
            }
        } else {
            info.na(msg);
        }
    });
}, 1));

bot.onText(/^\/smite(@\w+)?(?: @?\w+)?$/, event((msg, match) => {
    playerEvent(msg, (player) => {
        if (data.games[msg.chat.id]) {
            const game = data.games[msg.chat.id];

            if (game.time <= 0) {
                gather.smite(msg, player);
            } else {
                play.smite(msg, player);
            }
        } else {
            info.na(msg);
        }
    });
}, 1));

bot.onText(/^\/forcestart(@\w+)?$/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time <= 0) {
            gather.start(msg);
        }
    } else {
        info.na(msg);
    }
}, 1));

bot.onText(/^\/forcefallback(@\w+)?$/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time <= 0) {
            gather.fallback(msg);
        }
    } else {
        info.na(msg);
    }
}, 1));

bot.onText(/^\/forceorgasm(@\w+)?$/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time > 0) {
            play.orgasm(msg);
        }
    } else {
        info.na(msg);
    }
}, 1));

bot.onText(/^\/stat(@\w+)?(?: @?\w+)?$/, event((msg, match) => {
    playerEvent(msg, (player) => {
        stat.stat(msg, player);
    });
}, 1));

bot.onText(/^\/listall(@\w+)?$/, event((msg, match) => {
    command.all(msg);
}, 1));

bot.onText(/^\/list(@\w+)?(?: ((?!_)\w*))?$/, event((msg, match) => {
    command.list(msg, match[2] || '');
}, 1));

bot.onText(/^\/add(@\w+)? ((?!_)\w*)(?:@([^\r\n]*))?$/, event((msg, match) => {
    command.add(msg, match[2], match[3]);
}, 1));

bot.onText(/^\/((?!_)\w+)(@\w+)?(?: ([^\r\n]*))?$/, event((msg, match) => {
    let args = [];

    if (match[3]) {
        if (match[3].match('@')) {
            args = match[3].split('@');
        } else {
            args = match[3].split(' ');
        }
    }

    command.get(msg, match[1], args);
}, 2));

bot.on('inline_query', (query) => {
    if (config.ban[query.from.id]) {
        inline.banned(query);
    } else {
        inline.answer(query);
    }
});

bot.on('chosen_inline_result', (chosen) => {
    log(
        'inline:' + chosen.from.id + '@' + (chosen.from.username || ''),
        chosen.query
    );

    chosen.date = Date.now();
    data.writeQuery(chosen);
});

data.loadCommands();
data.loadStats();

setInterval(() => {
    for (const i in data.games) {
        const game = data.games[i];

        const mockMsg = {
            date: Date.now(),
            chat: {
                id: i,
            },
        };

        if (config.threesomeChatMap[i]) {
            mockMsg.chat.mapped = config.threesomeChatMap[i];
        } else {
            mockMsg.chat.mapped = i;
        }

        if (game.time <= 0) {
            if (game.time === 0) {
                fs.write(fd, i + ':' + util.inspect(game) + '\n', () => {
                    // nothing
                });

                data.writeGame(
                    mockMsg,
                    game
                );
            }

            gather.tick(mockMsg);
        } else {
            play.tick(mockMsg);

            if (game.time > 0 && game.time - game.total < -15 && game.time % 10 === 0) {
                command.tick(mockMsg);
            }
        }

        game.time += 1;
    }
}, 490);

for (const i in config.threesomePlugins) {
    require('./plugin.' + config.threesomePlugins[i])(
        bot,
        event,
        playerEvent,
        {
            data: data,

            info: info,
            gather: gather,
            init: init,
            play: play,
            stat: stat,
            command: command,
            inline: inline,
        }
    );
}

for (const i in config.threesomeExtraBots) {
    require('./' + config.threesomeExtraBots[i]);
}
