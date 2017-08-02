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

        writeMessage: (msg) => {
            fs.write(fdActions, JSON.stringify({
                msg: msg,
            }) + '\n', () => {
                // nothing
            });
        },

        writeQuery: (chosen) => {
            fs.write(fdActions, JSON.stringify({
                chosen: chosen,
            }) + '\n', () => {
                // nothing
            });
        },

        writeGame: (msg, game) => {
            fs.write(fdActions, JSON.stringify({
                msg: msg,
                game: game,
            }) + '\n', () => {
                // nothing
            });
        },

        writeCommand: (chat, key, value) => {
            fs.write(fdCommands, JSON.stringify({
                chat: chat,
                key: key,
                value: value,
            }) + '\n', () => {
                // nothing
            });
        },

        loadCommands: () => {
            readline.createInterface({
                input: fs.createReadStream(pathCommands),
            }).on('line', (line) => {
                const entry = JSON.parse(line);

                self.commands[entry.chat.id] = self.commands[entry.chat.id] || {};

                const command = self.commands[entry.chat.id];

                command['@' + entry.key] = command['@' + entry.key] || [];
                command['@' + entry.key].push({
                    text: entry.value,
                });
            });
        },

        loadStats: () => {
            self.stats.game = {};
            self.stats.command = {};
            self.stats.inline = {};

            readline.createInterface({
                input: fs.createReadStream(pathActions),
            }).on('line', (line) => {
                const entry = JSON.parse(line);

                if (entry.msg) {
                    if (entry.game) {
                        self.stats.game[entry.msg.chat.id] = self.stats.game[entry.msg.chat.id] || {
                            chat: {},
                            user: {},
                            pair: {},
                        };

                        const gameStat = self.stats.game[entry.msg.chat.id];

                        gameStat.chat[entry.game.usercount] = gameStat.chat[entry.game.usercount] || 0;
                        gameStat.chat[entry.game.usercount] += 1;

                        for (const i in entry.game.users) {
                            gameStat.user[i] = gameStat.user[i] || {};
                            gameStat.user[i][entry.game.usercount] = gameStat.user[i][entry.game.usercount] || 0;
                            gameStat.user[i][entry.game.usercount] += 1;

                            for (const j in entry.game.users) {
                                if (j !== i) {
                                    gameStat.pair[i] = gameStat.pair[i] || {};
                                    gameStat.pair[i][j] = gameStat.pair[i][j] || 0;
                                    gameStat.pair[i][j] += 1;
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

                        const command = entry.msg.text.match(/^\/((?!_)\w+)/)[1];

                        if (!command) {
                            // TODO
                            console.error(entry);
                        }

                        // TODO
                    }
                } else if (entry.chosen) {
                    self.stats.inline[entry.chosen.from.id] = self.stats.inline[entry.chosen.from.id] || {
                        count: 0,
                        sumLength: 0,
                        maxLength: 0,
                    };

                    const inlineStat = self.stats.inline[entry.chosen.from.id];

                    if (entry.result_id === 'CONTENT') {
                        // TODO
                    } else if (entry.chosen.result_id === 'CONTENT_TMP') {
                        // TODO
                    } else {
                        // never reach
                        console.error(entry);
                    }
                } else {
                    // never reach
                    console.error(entry);
                }
            });
        },
    };

    return self;
};
