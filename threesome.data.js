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

        loadMessage: (msg) => {},

        writeMessage: (msg) => {
            self.loadMessage(msg);

            fs.write(fdActions, JSON.stringify({
                msg: msg,
            }) + '\n', () => {
                // nothing
            });
        },

        loadQuery: (chosen) => {},

        writeQuery: (chosen) => {
            self.loadQuery(chosen);

            fs.write(fdActions, JSON.stringify({
                chosen: chosen,
            }) + '\n', () => {
                // nothing
            });
        },

        loadGame: (msg, game) => {},

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
            self.commands[chat.id] = self.commands[chat.id] || {};

            const command = self.commands[chat.id];

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

            const genName = (user) => {
                if (user.id) {
                    self.stats.name[user.id] = user.first_name
                        || user.last_name
                        || self.stats.name[user.id];
                }
            };

            readline.createInterface({
                input: fs.createReadStream(pathActions),
            }).on('line', (line) => {
                const entry = JSON.parse(line);

                if (entry.msg) {
                    if (entry.game) {
                        self.stats.game[entry.msg.chat.id] = self.stats.game[entry.msg.chat.id] || {
                            chat: {},
                            userTotal: {},
                            user: {},
                            pair: {},
                        };

                        const gameStat = self.stats.game[entry.msg.chat.id];

                        gameStat.chat[entry.game.usercount] = (gameStat.chat[entry.game.usercount] || 0) + 1;

                        for (const i in entry.game.users) {
                            genName(entry.game.users[i]);

                            gameStat.userTotal[i] = (gameStat.userTotal[i] || 0) + 1;

                            gameStat.user[i] = gameStat.user[i] || {};
                            gameStat.user[i][entry.game.usercount] = (gameStat.user[i][entry.game.usercount] || 0) + 1;

                            for (const j in entry.game.users) {
                                if (j !== i) {
                                    gameStat.pair[i] = gameStat.pair[i] || {};
                                    gameStat.pair[i][j] = (gameStat.pair[i][j] || 0) + 1;
                                }
                            }
                        }
                    } else {
                        self.stats.command[entry.msg.chat.id] = self.stats.command[entry.msg.chat.id] || {
                            chat: {},
                            user: {},
                            pair: {},
                            reply: {},
                            replyPair: {},
                        };

                        const commandStat = self.stats.command[entry.msg.chat.id];

                        const command = entry.msg.text.match(/^\/(?!_)\w+/)[0];

                        commandStat.chat[command] = (commandStat.chat[command] || 0) + 1;

                        const i = entry.msg.from.id;

                        genName(entry.msg.from);

                        commandStat.user[i] = commandStat.user[i] || {};
                        commandStat.user[i][command] = (commandStat.user[i][command] || 0) + 1;

                        // TODO: support @username?
                        if (entry.msg.reply_to_message) {
                            const j = entry.msg.reply_to_message.from.id;

                            genName(entry.msg.reply_to_message.from);

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
                } else if (entry.chosen) {
                    self.stats.inline[entry.chosen.from.id] = self.stats.inline[entry.chosen.from.id] || {};

                    const inlineStat = self.stats.inline[entry.chosen.from.id];

                    genName(entry.chosen.from);

                    if (entry.chosen.result_id === 'CONTENT') {
                        // notice: see the implementation of inline query
                        if (entry.chosen.query.match('@')) {
                            const len = entry.chosen.query.split('@').length;

                            inlineStat[len] = (inlineStat[len] || 0) + 1;
                        } else {
                            const len = entry.chosen.query.split(' ').length;

                            inlineStat[len] = (inlineStat[len] || 0) + 1;
                        }
                    } else if (entry.chosen.result_id === 'CONTENT_TMP') {
                        // notice: ignore because of too many duplication records
                    } else {
                        // never reach
                        throw Error(JSON.stringify(entry));
                    }
                } else {
                    // never reach
                    throw Error(JSON.stringify(entry));
                }
            });
        },
    };

    return self;
};
