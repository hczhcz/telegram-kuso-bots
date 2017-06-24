'use strict';

const fs = require('fs');

// TODO: from config?
const fdActions = fs.openSync('./log.actions', 'a');
const fdCommands = fs.openSync('./log.commands', 'a');

const games = {};
const commands = {};

(() => {
    // TODO: from config?
    const commandLog = JSON.parse('[' + fs.readFileSync('./log.commands') + '{}]');

    for (const i in commandLog) {
        if (i < commandLog.length - 1) {
            const entry = commandLog[i];

            commands[entry.chat.id] = commands[entry.chat.id] || {};

            const command = commands[entry.chat.id];

            command[entry.key] = command[entry.key] || [];
            command[entry.key].push(entry.value);
        }
    }
})();

module.exports.games = games;
module.exports.commands = commands;

module.exports.writeMessage = (msg, match) => {
    fs.write(fdActions, JSON.stringify({
        msg: msg,
        match: match,
    }) + ',\n', () => {});
};

module.exports.writeGame = (msg, game) => {
    fs.write(fdActions, JSON.stringify({
        msg: msg,
        game: game,
    }) + ',\n', () => {});
};

module.exports.writeCommand = (chat, key, value) => {
    data.writeCommand(fdCommands, JSON.stringify({
        chat: chat,
        key: key,
        value: value,
    }) + ',\n', () => {});
};
