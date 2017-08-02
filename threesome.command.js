'use strict';

module.exports = (bot, games, commands, writeCommand) => {
    const self = {
        all: (msg) => {
            const command = commands[msg.chat.id] || {};

            let text = '';

            for (const i in command) {
                text += (i.slice(1) || '<bot自言自语>') + '\n';
            }

            if (text) {
                return bot.sendMessage(
                    msg.chat.id,
                    text,
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            }
        },

        list: (msg, key) => {
            const command = commands[msg.chat.id] || {};

            let text = '';

            for (const i in command['@' + key]) {
                const entry = command['@' + key][i];

                text += entry.text + '\n';
            }

            return bot.sendMessage(
                msg.chat.id,
                text || '<什么都没有呢>',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },

        add: (msg, key, value) => {
            commands[msg.chat.id] = commands[msg.chat.id] || {};

            const command = commands[msg.chat.id];

            command['@' + key] = command['@' + key] || [];

            for (const i in command['@' + key]) {
                if (command['@' + key][i].text === value) {
                    return bot.sendMessage(
                        msg.chat.id,
                        '已经加过了啦！',
                        {
                            reply_to_message_id: msg.message_id,
                        }
                    );
                }
            }

            command['@' + key].push({
                text: value,
            });

            writeCommand(
                msg.chat,
                key,
                value
            );

            return bot.sendMessage(
                msg.chat.id,
                '已加入 ' + (key || 'bot自言自语') + ' 套餐！',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },

        get: (msg, key, args) => {
            const game = games[msg.chat.id];
            const command = commands[msg.chat.id] || {};
            const now = Date.now();

            let tot = [];
            let level = 0;

            for (const i in command['@' + key]) {
                const entry = command['@' + key][i];

                let text = '';
                let match = {};

                if (!entry.used || Math.random() < (now - entry.used) / 30000 - 1) {
                    for (let j = 0; j < entry.text.length; j += 1) {
                        if (entry.text[j] === '$') {
                            if (entry.text.slice(j).startsWith('$ME')) {
                                // notice: protection for mock objects
                                if (msg.from) {
                                    text += msg.from.first_name || msg.from.last_name;
                                    j += 2;
                                } else {
                                    match = null;
                                    break;
                                }
                            } else if (entry.text.slice(j).startsWith('$YOU')) {
                                if (msg.reply_to_message) {
                                    text += msg.reply_to_message.from.first_name || msg.reply_to_message.from.last_name;
                                    match.you = 1;
                                    j += 3;
                                } else {
                                    match = null;
                                    break;
                                }
                            } else if (entry.text.slice(j).startsWith('$MODE')) {
                                if (game) {
                                    text += game.modename;
                                    match.mode = 1;
                                    j += 4;
                                } else {
                                    match = null;
                                    break;
                                }
                            } else if (entry.text.slice(j).startsWith('$1')) {
                                if (args[0]) {
                                    text += args[0];
                                    match.args = Math.max(match.args || 0, 1);
                                    j += 1;
                                } else {
                                    match = null;
                                    break;
                                }
                            } else if (entry.text.slice(j).startsWith('$2')) {
                                if (args[1]) {
                                    text += args[1];
                                    match.args = Math.max(match.args || 0, 2);
                                    j += 1;
                                } else {
                                    match = null;
                                    break;
                                }
                            } else if (entry.text.slice(j).startsWith('$3')) {
                                if (args[2]) {
                                    text += args[2];
                                    match.args = Math.max(match.args || 0, 3);
                                    j += 1;
                                } else {
                                    match = null;
                                    break;
                                }
                            } else {
                                text += entry.text[j];
                            }
                        } else {
                            text += entry.text[j];
                        }
                    }

                    if (match) {
                        let newLevel = 0;

                        for (const j in match) {
                            newLevel += match[j];
                        }

                        if (level <= newLevel) {
                            if (level < newLevel) {
                                tot = [];
                                level = newLevel;
                            }

                            tot.push({
                                text: text,
                                entry: entry,
                            });
                        }
                    }
                }
            }

            if (tot.length > 0) {
                const choice = Math.floor(Math.random() * tot.length);

                tot[choice].entry.used = now;

                return bot.sendMessage(
                    msg.chat.id,
                    tot[choice].text
                );
            }
        },

        tick: (msg) => {
            const game = games[msg.chat.id];

            if (Math.random() < (1 + Math.min(game.usercount, 3)) / 8) {
                const args = [];

                let userbase = game.usercount;
                let userneed = Math.min(Math.floor(Math.random() * (game.usercount + 1)), 3);

                for (const i in game.users) {
                    if (Math.random() < userneed / userbase) {
                        args.push(game.users[i].first_name || game.users[i].last_name);
                        userneed -= 1;
                    }

                    userbase -= 1;
                }

                // shuffle
                for (let i = args.length - 1; i >= 0; i -= 1) {
                    const pos = Math.floor(Math.random() * (i + 1));

                    const tmp = args[i];

                    args[i] = args[pos];
                    args[pos] = tmp;
                }

                self.get(msg, '', args);
            }
        },
    };

    return self;
};
