'use strict';

module.exports = (bot, games, commands) => {
    return {
        all: (msg) => {
            commands[msg.chat.id] = commands[msg.chat.id] || {};

            const command = commands[msg.chat.id];

            let text = '';

            for (const i in command) {
                text += i + '\n';
            }

            return bot.sendMessage(
                msg.chat.id,
                text,
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },

        list: (msg, key) => {
            commands[msg.chat.id] = commands[msg.chat.id] || {};

            const command = commands[msg.chat.id];

            command[key] = command[key] || [];

            let text = '';

            for (const i in command[key]) {
                text += command[key][i] + '\n';
            }

            return bot.sendMessage(
                msg.chat.id,
                text,
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },

        add: (msg, key, value) => {
            commands[msg.chat.id] = commands[msg.chat.id] || {};

            const command = commands[msg.chat.id];

            command[key] = command[key] || [];
            command[key].push(value);

            return bot.sendMessage(
                msg.chat.id,
                '已加入 ' + key + ' 套餐！',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },

        get: (msg, key, args) => {
            commands[msg.chat.id] = commands[msg.chat.id] || {};

            const game = games[msg.chat.id];
            const command = commands[msg.chat.id];

            let tot = [];

            for (const i in command[key]) {
                let text = '';

                for (let j = 0; j < command[key][i].length; ++j) {
                    if (command[key][i][j] == '$') {
                        if (command[key][i].slice(j).startsWith('$ME')) {
                            text += msg.from.first_name || msg.from.last_name;
                            j += 2;
                        } else if (command[key][i].slice(j).startsWith('$YOU')) {
                            if (msg.reply_to_message) {
                                text += msg.reply_to_message.from.first_name || msg.reply_to_message.from.last_name;
                                j += 3;
                            } else {
                                text = '';
                                break;
                            }
                        } else if (command[key][i].slice(j).startsWith('$MODE')) {
                            if (game) {
                                text += game.modename;
                                j += 4;
                            } else {
                                text = '';
                                break;
                            }
                        } else if (command[key][i].slice(j).startsWith('$1')) {
                            if (args[0]) {
                                text += args[0] || '';
                                j += 1;
                            } else {
                                text = '';
                                break;
                            }
                        } else if (command[key][i].slice(j).startsWith('$2')) {
                            if (args[1]) {
                                text += args[1] || '';
                                j += 1;
                            } else {
                                text = '';
                                break;
                            }
                        } else if (command[key][i].slice(j).startsWith('$3')) {
                            if (args[2]) {
                                text += args[2] || '';
                                j += 1;
                            } else {
                                text = '';
                                break;
                            }
                        } else {
                            text += command[key][i][j];
                        }
                    } else {
                        text += command[key][i][j];
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

            // return ...
        },
    };
};
