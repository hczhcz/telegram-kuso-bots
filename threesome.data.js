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
        },
    };

    return self;
};
