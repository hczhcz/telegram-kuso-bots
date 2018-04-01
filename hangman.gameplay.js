'use strict';

const config = require('./config');

const core = require('./hangman.core');

const games = {};
const meows = {};

const hint = (answer) => {
    return '喵'.repeat(core.length(answer));
};

const init = (id, meowId, dict, keyboardSize, onGameInit, onGameExist) => {
    if (games[id]) {
        return onGameExist();
    }

    let answer = null;

    if (meows[meowId]) {
        answer = meows[meowId];

        delete meows[meowId];
    } else {
        answer = core.dictSelect(dict);
    }

    const game = games[id] = {
        answer: answer,
        hint: hint(answer),
        keyboard: core.makeKeyboard(dict, answer, keyboardSize),
        history: [],
    };

    return onGameInit(game);
};

const click = (id, playerId, char, onGameContinue, onGameWin, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    game.hint = core.guess(game.answer, game.hint, char);
    game.history.push([playerId, char]);

    if (game.answer === game.hint) {
        delete games[id];

        onGameWin(game);
    } else {
        onGameContinue(game);
    }
};

module.exports = {
    init: init,
    click: click,
};
