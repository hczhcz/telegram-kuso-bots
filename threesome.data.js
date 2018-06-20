'use strict';

const fs = require('fs');
const readline = require('readline');

module.exports = (pathActions, pathCommands) => {
    const fdActions = fs.openSync(pathActions, 'a');
    const fdCommands = fs.openSync(pathCommands, 'a');

    const self = {
        games: {},
        commands: {},
        stats: {},

        genName: (user) => {
            if (user.id) {
                self.stats.name[user.id] = user.first_name
                    || user.last_name
                    || self.stats.name[user.id];
            }
        },

        loadMessage: (msg) => {
            self.stats.command[msg.chat.id] = self.stats.command[msg.chat.id] || {
                chat: {},
                user: {},
                pair: {},
                reply: {},
                replyPair: {},
            };

            const match = msg.text
                ? msg.text.match(/^\/(?!_)\w+/)
                : null;

            if (match) {
                const commandStat = self.stats.command[msg.chat.id];

                const command = match[0];

                commandStat.chat[command] = (commandStat.chat[command] || 0) + 1;

                const i = msg.from.id;

                self.genName(msg.from);

                commandStat.user[i] = commandStat.user[i] || {};
                commandStat.user[i][command] = (commandStat.user[i][command] || 0) + 1;

                // TODO: support @username?
                if (msg.reply_to_message) {
                    const j = msg.reply_to_message.from.id;

                    self.genName(msg.reply_to_message.from);

                    commandStat.pair[i] = commandStat.pair[i] || {};
                    commandStat.pair[i][j] = commandStat.pair[i][j] || {};
                    commandStat.pair[i][j][command] = (commandStat.pair[i][j][command] || 0) + 1;

                    commandStat.reply[j] = commandStat.reply[j] || {};
                    commandStat.reply[j][command] = (commandStat.reply[j][command] || 0) + 1;

                    commandStat.replyPair[j] = commandStat.replyPair[j] || {};
                    commandStat.replyPair[j][i] = commandStat.replyPair[j][i] || {};
                    commandStat.replyPair[j][i][command] = (commandStat.replyPair[j][i][command] || 0) + 1;
                }
            }
        },

        writeMessage: (msg) => {
            self.loadMessage(msg);

            fs.write(fdActions, JSON.stringify({
                msg: msg,
            }) + '\n', () => {
                // nothing
            });
        },

        loadQuery: (chosen) => {
            self.stats.inline[chosen.from.id] = self.stats.inline[chosen.from.id] || {};

            const inlineStat = self.stats.inline[chosen.from.id];

            self.genName(chosen.from);

            if (chosen.result_id === 'CONTENT') {
                // notice: see the implementation of inline query
                if (chosen.query.match('@')) {
                    const len = chosen.query.split('@').length;

                    inlineStat[len] = (inlineStat[len] || 0) + 1;
                } else {
                    const len = chosen.query.split(' ').length;

                    inlineStat[len] = (inlineStat[len] || 0) + 1;
                }
            } else if (chosen.result_id === 'CONTENT_TMP') {
                // notice: ignore because of too many duplication records
            } else {
                // never reach
                throw Error(JSON.stringify(chosen));
            }
        },

        writeQuery: (chosen) => {
            self.loadQuery(chosen);

            fs.write(fdActions, JSON.stringify({
                chosen: chosen,
            }) + '\n', () => {
                // nothing
            });
        },

        loadGame: (msg, game) => {
            self.stats.game[msg.chat.id] = self.stats.game[msg.chat.id] || {
                chat: {},
                userTotal: {},
                user: {},
                pair: {},
            };

            const gameStat = self.stats.game[msg.chat.id];

            gameStat.chat[game.usercount] = (gameStat.chat[game.usercount] || 0) + 1;

            for (const i in game.users) {
                self.genName(game.users[i]);

                gameStat.userTotal[i] = (gameStat.userTotal[i] || 0) + 1;

                gameStat.user[i] = gameStat.user[i] || {};
                gameStat.user[i][game.usercount] = (gameStat.user[i][game.usercount] || 0) + 1;

                for (const j in game.users) {
                    if (j !== i) {
                        gameStat.pair[i] = gameStat.pair[i] || {};
                        gameStat.pair[i][j] = (gameStat.pair[i][j] || 0) + 1;
                    }
                }
            }
        },

        writeGame: (msg, game) => {
            self.loadGame(msg, game);

            fs.write(fdActions, JSON.stringify({
                msg: msg,
                game: game,
            }) + '\n', () => {
                // nothing
            });
        },

        loadCommand: (chat, key, entry) => {
            self.commands[chat.mapped] = self.commands[chat.mapped] || {};

            const command = self.commands[chat.mapped];

            entry.chat_id = chat.id;

            command['/' + key] = command['/' + key] || [];
            command['/' + key].push(entry);
        },

        writeCommand: (chat, key, entry) => {
            self.loadCommand(chat, key, entry);

            fs.write(fdCommands, JSON.stringify({
                chat: chat,
                key: key,
                entry: entry,
            }) + '\n', () => {
                // nothing
            });
        },

        loadCommands: () => {
            readline.createInterface({
                input: fs.createReadStream(pathCommands),
            }).on('line', (line) => {
                const obj = JSON.parse(line);

                self.loadCommand(obj.chat, obj.key, obj.entry);
            });
        },

        loadStats: () => {
            self.stats.game = {};
            self.stats.command = {};
            self.stats.inline = {};
            self.stats.name = {};

            readline.createInterface({
                input: fs.createReadStream(pathActions),
            }).on('line', (line) => {
                const obj = JSON.parse(line);

                if (obj.msg) {
                    if (obj.game) {
                        self.loadGame(obj.msg, obj.game);
                    } else {
                        self.loadMessage(obj.msg);
                    }
                } else if (obj.chosen) {
                    self.loadQuery(obj.chosen);
                } else {
                    // never reach
                    throw Error(JSON.stringify(obj));
                }
            });
        },
    };

    return self;
};
