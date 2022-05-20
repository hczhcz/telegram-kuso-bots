'use strict';

const config = require('./config');

const core = require('./wordle.core');

const games = {};

const init = (id, mode, dict, onGameInit, onGameExist) => {
    if (games[id]) {
        return onGameExist();
    }

    games[id] = {
        answer: core.dictSelect(dict),
        mode: mode,
        dict: dict,
        guess: {},
    };

    const game = games[id];

    return onGameInit(game);
};

const end = (id, onGameEnd, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    delete game.dict;

    delete games[id];

    return onGameEnd(game);
};

const guess = (id, word, onGuess, onGameEnd, onGuessDuplicated, onNotValid, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    if (game.guess['#' + word]) {
        return onGuessDuplicated();
    }

    const result = core.guess(game.dict, word, game.answer);

    if (result === -1) {
        return onNotValid();
    }

    game.guess['#' + word] = ('0'.repeat(word.length) + result).slice(-word.length);

    if (Object.keys(game.guess).length > config.wordleMaxGuess) {
        for (const i in game.guess) {
            // delete the first one
            delete game.guess[i];

            break;
        }
    }

    if (game.guess['#' + word] === '2'.repeat(word.length)) {
        return end(id, onGameEnd, onGameNotExist);
    }

    return onGuess(game);
};

const count = () => {
    return Object.keys(games).length;
};

module.exports = {
    init: init,
    end: end,
    guess: guess,
    count: count,
};
