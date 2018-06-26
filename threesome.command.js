'use strict';

module.exports = (bot, games, commands, writeCommand) => {
    const self = {
        all: (msg) => {
            const command = commands[msg.chat.mapped] || {};

            let text = '';

            for (const i in command) {
                text += (i.slice(1) || '<bot自言自语>') + '\n';
            }

            return bot.sendMessage(
                msg.chat.id,
                text || '<什么都没有呢>',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },

        list: (msg, key) => {
            const command = commands[msg.chat.mapped] || {};

            let text = '';

            for (const i in command['/' + key]) {
                const entry = command['/' + key][i];

                if (entry.text) {
                    text += entry.text + '\n';
                } else if (entry.forward) {
                    text += '<转发消息>\n';
                } else {
                    // never reach
                    throw Error(JSON.stringify(entry));
                }
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
            commands[msg.chat.mapped] = commands[msg.chat.mapped] || {};

            const command = commands[msg.chat.mapped];

            const entry = {};

            if (value) {
                entry.text = value;
            } else if (msg.reply_to_message) {
                entry.forward = msg.reply_to_message.message_id;
            } else {
                return bot.sendMessage(
                    msg.chat.id,
                    '什么都没有呢！',
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            }

            entry.chat_id = msg.chat.id;

            for (const i in command['/' + key]) {
                if (
                    entry.text && command['/' + key][i].text === entry.text
                    || entry.forward && command['/' + key][i].forward === entry.forward
                ) {
                    return bot.sendMessage(
                        msg.chat.id,
                        '已经加过了啦！',
                        {
                            reply_to_message_id: msg.message_id,
                        }
                    );
                }
            }

            writeCommand(
                msg.chat,
                key,
                entry
            );

            return bot.sendMessage(
                msg.chat.id,
                '已加入 ' + (key || 'bot自言自语') + ' 套餐！',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },

        tryGet: (msg, key, args, allowForward) => {
            const game = games[msg.chat.id];
            const command = commands[msg.chat.mapped] || {};
            const now = Date.now();

            let tot = [];
            let level = 0;

            const genText = (entry) => {
                let text = '';
                const match = {};

                for (let i = 0; i < entry.text.length; i += 1) {
                    const head = entry.text.slice(i);

                    if (head.startsWith('$ME')) {
                        // notice: protection for mock objects
                        if (msg.from) {
                            text += msg.from.first_name
                                || msg.from.last_name;
                            i += 2;
                        } else {
                            return;
                        }
                    } else if (head.startsWith('$YOU')) {
                        if (msg.reply_to_message) {
                            text += msg.reply_to_message.from.first_name
                                || msg.reply_to_message.from.last_name;
                            match.you = 1;
                            i += 3;
                        } else {
                            return;
                        }
                    } else if (head.startsWith('$MODE')) {
                        if (game) {
                            text += game.modename;
                            i += 4;
                        } else {
                            return;
                        }
                    } else if (head.startsWith('$1')) {
                        if (args[0]) {
                            text += args[0];
                            match.args = Math.max(match.args || 0, 1);
                            i += 1;
                        } else {
                            return;
                        }
                    } else if (head.startsWith('$2')) {
                        if (args[1]) {
                            text += args[1];
                            match.args = Math.max(match.args || 0, 2);
                            i += 1;
                        } else {
                            return;
                        }
                    } else if (head.startsWith('$3')) {
                        if (args[2]) {
                            text += args[2];
                            match.args = Math.max(match.args || 0, 3);
                            i += 1;
                        } else {
                            return;
                        }
                    } else {
                        text += entry.text[i];
                    }
                }

                let newLevel = 0;

                for (const i in match) {
                    newLevel += match[i];
                }

                if (level <= newLevel) {
                    if (level < newLevel) {
                        tot = [];
                        level = newLevel;
                    }

                    tot.push({
                        entry: entry,
                        text: text,
                    });
                }
            };

            const genForward = (entry) => {
                if (allowForward && level === 0) {
                    tot.push({
                        entry: entry,
                        chat_id: entry.chat_id,
                        forward: entry.forward,
                    });
                }
            };

            for (const i in command['/' + key]) {
                const entry = command['/' + key][i];

                if (!entry.used || Math.random() < (now - entry.used) / 30000 - 1) {
                    if (entry.text) {
                        genText(entry);
                    } else if (entry.forward) {
                        genForward(entry);
                    } else {
                        // never reach
                        throw Error(JSON.stringify(entry));
                    }
                }
            }

            if (tot.length > 0) {
                const choice = Math.floor(Math.random() * tot.length);

                tot[choice].entry.used = now;

                return tot[choice];
            }
        },

        get: (msg, key, args) => {
            const chosen = self.tryGet(msg, key, args, true);

            if (chosen) {
                if (chosen.text) {
                    return bot.sendMessage(
                        msg.chat.id,
                        chosen.text
                    );
                } else if (chosen.forward) {
                    return bot.forwardMessage(
                        msg.chat.id,
                        chosen.chat_id,
                        chosen.forward
                    );
                }

                // never reach
                throw Error(JSON.stringify(chosen));
            }
        },

        tick: (msg) => {
            const game = games[msg.chat.id];

            if (Math.random() < (1 + Math.min(game.usercount, 3)) / 8) {
                const args = [];

                let userbase = game.usercount;
                let userneed = 0;

                if (game.usercount >= 3 && Math.random() < 1 / 3) {
                    userneed = 3;
                } else if (game.usercount >= 2 && Math.random() < 1 / 2) {
                    userneed = 2;
                } else if (game.usercount >= 1 && Math.random() < 2 / 3) {
                    userneed = 1;
                }

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
