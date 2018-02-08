'use strict';

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.threesomeToken);

const data = require('./threesome.data')(config.threesomePathActions, config.threesomePathCommands);

const info = require('./threesome.info')(bot);
const gather = require('./threesome.gather')(bot, data.games, data.writeGame);
const init = require('./threesome.init')(bot, data.games);
const play = require('./threesome.play')(bot, data.games);
const stat = require('./threesome.stat')(bot, data.stats);
const command = require('./threesome.command')(bot, data.games, data.commands, data.writeCommand);
const inline = require('./threesome.inline')(bot);

process.on('uncaughtException', (err) => {
    console.error(Date());
    console.error(err);
});

const event = (handler, atIndex) => {
    return (msg, match) => {
        if (!match[atIndex || 1] || match[atIndex || 1] === '@' + config.threesomeUsername) {
            if (!msg.has_log) {
                console.log('[' + Date() + '] ' + msg.chat.id + ':' + msg.from.id + ' ' + match[0]);
                data.writeMessage(msg);

                msg.has_log = true;
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

const mappedEvent = (msg, handler) => {
    const id = msg.chat.id;

    if (config.threesomeChatMap[id]) {
        msg.chat.id = config.threesomeChatMap[id];
    }

    handler();

    msg.chat.id = id;
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
}));

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
}));

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
}));

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
}));

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
}));

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
}));

bot.onText(/^\/extend(@\w+)?(?: ([+\-]?\d+)\w*)?$/, event((msg, match) => {
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
}));

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
}));

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
}));

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
}));

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
}));

bot.onText(/^\/forcestart(@\w+)?$/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time <= 0) {
            gather.start(msg);
        }
    } else {
        info.na(msg);
    }
}));

bot.onText(/^\/forcefallback(@\w+)?$/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time <= 0) {
            gather.fallback(msg);
        }
    } else {
        info.na(msg);
    }
}));

bot.onText(/^\/forceorgasm(@\w+)?$/, event((msg, match) => {
    if (data.games[msg.chat.id]) {
        const game = data.games[msg.chat.id];

        if (game.time > 0) {
            play.orgasm(msg);
        }
    } else {
        info.na(msg);
    }
}));

bot.onText(/^\/stat(@\w+)?(?: @?\w+)?$/, event((msg, match) => {
    playerEvent(msg, (player) => {
        stat.stat(msg, player);
    });
}));

bot.onText(/^\/listall(@\w+)?$/, event((msg, match) => {
    mappedEvent(msg, () => {
        command.all(msg);
    });
}));

bot.onText(/^\/list(@\w+)?(?: ((?!_)\w*))?$/, event((msg, match) => {
    mappedEvent(msg, () => {
        command.list(msg, match[2] || '');
    });
}));

bot.onText(/^\/add(@\w+)? ((?!_)\w*)(?:@([^\r\n]*))?$/, event((msg, match) => {
    mappedEvent(msg, () => {
        command.add(msg, match[2], match[3]);
    });
}));

bot.onText(/^\/((?!_)\w+)(@\w+)?(?: ([^\r\n]*))?$/, event((msg, match) => {
    mappedEvent(msg, () => {
        let args = [];

        if (match[3]) {
            if (match[3].match('@')) {
                args = match[3].split('@');
            } else {
                args = match[3].split(' ');
            }
        }

        command.get(msg, match[1], args);
    });
}, 2));

bot.on('inline_query', (query) => {
    // console.log('[' + Date() + '] inline:' + query.from.id + ' ' + query.query);
    // data.writeQuery(query);

    if (config.ban[query.from.id]) {
        inline.banned(query);
    } else {
        inline.answer(query);
    }
});

bot.on('chosen_inline_result', (chosen) => {
    console.log('[' + Date() + '] inline:' + chosen.from.id + ' ' + chosen.query);

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

        if (game.time <= 0) {
            gather.tick(mockMsg);
        } else {
            play.tick(mockMsg);

            if (game.time > 0 && game.time - game.total < -15 && game.time % 10 === 0) {
                mappedEvent(mockMsg, () => {
                    command.tick(mockMsg);
                });
            }
        }

        game.time += 1;
    }
}, 490);

for (const i in config.threesomePlugins) {
    require('./plugin.' + config.threesomePlugins[i])(bot);
}
