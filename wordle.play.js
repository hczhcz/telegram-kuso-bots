'use strict';

const config = require('./config');

const core = require('./wordle.core');

const games = {};

const init = (id, onGameInit, onGameExist) => {
    if (games[id]) {
        return onGameExist();
    }

    games[id] = {
        answer: core.init(),
        active: true,
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

    delete game.active;

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

    const result = core.guess(word, game.answer);

    if (result === -1) {
        return onNotValid();
    }

    game.guess['#' + word] = ('0000' + result).slice(-5);

    if (Object.keys(game.guess).length > config.wordleMaxGuess) {
        for (const i in game.guess) {
            // delete the first one
            delete game.guess[i];

            break;
        }
    }

    if (result === 22222) {
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
