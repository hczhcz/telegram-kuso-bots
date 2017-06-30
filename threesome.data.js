'use strict';

const fs = require('fs');

module.exports = (pathActions, pathCommands) => {
    const fdActions = fs.openSync(pathActions, 'a');
    const fdCommands = fs.openSync(pathCommands, 'a');

    const games = {};
    const commands = {};

    (() => {
        // TODO: from config?
        const commandLog = JSON.parse('[' + fs.readFileSync(pathCommands) + '{}]');

        for (const i in commandLog) {
            if (i < commandLog.length - 1) {
                const entry = commandLog[i];

                commands[entry.chat.id] = commands[entry.chat.id] || {};

                const command = commands[entry.chat.id];

                command['@' + entry.key] = command['@' + entry.key] || [];
                command['@' + entry.key].push({
                    text: entry.value,
                });
            }
        }
    })();

    return {
        games: games,
        commands: commands,

        writeMessage: (msg, match) => {
            fs.write(fdActions, JSON.stringify({
                msg: msg,
                match: match,
            }) + ',\n', () => {});
        },

        writeGame: (msg, game) => {
            fs.write(fdActions, JSON.stringify({
                msg: msg,
                game: game,
            }) + ',\n', () => {});
        },

        writeCommand: (chat, key, value) => {
            fs.write(fdCommands, JSON.stringify({
                chat: chat,
                key: key,
                value: value,
            }) + ',\n', () => {});
        },
    };
};
