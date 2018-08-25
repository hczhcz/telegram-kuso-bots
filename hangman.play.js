'use strict';

const core = require('./hangman.core');

const games = {};
const meows = {};

const meowInit = (meowId, answer) => {
    meows[meowId] = answer;
};

const hint = (answer) => {
    return '.'.repeat(core.length(answer));
};

const init = (id, meowId, dict, keyboardSize, onGameInit, onGameExist) => {
    if (games[id]) {
        return onGameExist();
    }

    let answer = null;

    if (meows[meowId] && core.length(meows[meowId]) <= keyboardSize) {
        answer = meows[meowId];

        delete meows[meowId];
    } else {
        answer = core.dictSelect(dict);
    }

    games[id] = {
        answer: answer,
        hint: hint(answer),
        keyboard: core.makeKeyboard(dict, answer, keyboardSize),
        history: [],
    };

    return onGameInit(games[id]);
};

const click = (id, playerId, charIndex, onGameContinue, onGameWin, onNotValid, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    const char = game.keyboard[charIndex];
    const oldHint = game.hint;

    if (char) {
        game.hint = core.guess(game.answer, game.hint, char);
        game.keyboard[charIndex] = null;
        game.history.push([playerId, char, game.hint !== oldHint]);

        if (game.hint === game.answer) {
            delete game.hint;

            delete games[id];

            return onGameWin(game);
        }

        return onGameContinue(game);
    }

    return onNotValid();
};

const count = () => {
    return Object.keys(games).length;
};

module.exports = {
    meowInit: meowInit,
    init: init,
    click: click,
    count: count,
};
