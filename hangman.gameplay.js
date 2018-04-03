'use strict';

const core = require('./hangman.core');

const games = {};
const meows = {};

const meowInit = (meowId, answer) => {
    meows[meowId] = answer;
};

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
        error: 0,
        history: [],
    };

    return onGameInit(game);
};

const click = (id, playerId, key, onGameContinue, onGameWin, onNotValid, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    const char = game.keyboard[key];
    const oldHint = game.hint;

    if (char) {
        game.hint = core.guess(game.answer, game.hint, char);
        game.keyboard[key] = null;
        game.history.push([playerId, char]);

        if (game.hint === game.answer) {
            delete games[id];

            return onGameWin(game);
        }

        if (game.hint === oldHint) {
            error += 1;
        }

        return onGameContinue(game);
    } else {
        return onNotValid();
    }
};

module.exports = {
    meowInit: meowInit,
    init: init,
    click: click,
};
