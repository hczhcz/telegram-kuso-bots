'use strict';

const config = require('./config');

const enCore = require('./wordle.en.core');
const cnCore = require('./wordle.cn.core');

const games = {};

const init = (id, language, mode, onGameInit, onGameExist) => {
    if (games[id]) {
        return onGameExist();
    }

    games[id] = {
        language: language,
        mode: mode,
        answer: null,
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

    delete games[id];

    return onGameEnd(game);
};

const get = (id, onDone, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    return onDone(game);
};

const verify = (id, language, size, onValid, onNotValid, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    if (game.language === language && (!game.answer || game.answer.length === size)) {
        return onValid(game.mode);
    }

    return onNotValid();
};

const guess = (id, dict, word, onGuess, onGameEnd, onGuessDuplicated, onNotValid, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const core = {
        en: enCore,
        cn: cnCore,
    }[dict.language];
    const game = games[id];
    const answer = game.answer || core.dictSelect(dict);

    if (game.guess['#' + word]) {
        return onGuessDuplicated();
    }

    const result = core.guess(dict, word, answer);

    if (result === -1) {
        return onNotValid();
    }

    game.answer = answer;
    game.guess['#' + word] = result;

    if (Object.keys(game.guess).length > config.wordleMaxGuess) {
        for (const i in game.guess) {
            // delete the first one
            delete game.guess[i];

            break;
        }
    }

    if (word === game.answer) {
        return end(id, onGameEnd, onGameNotExist);
    }

    return onGuess(game);
};

const say = (language, word, onSay, onNotValid) => {
    const core = {
        en: enCore,
        cn: cnCore,
    }[language];

    const dict = core.dictInit();

    core.dictAdd(dict, word, true);

    const game = {
        language: language,
        answer: word,
        guess: {},
    };
    const result = core.guess(dict, word, word);

    if (result === -1) {
        return onNotValid();
    }

    game.guess['#' + word] = result;

    return onSay(game);
};

const count = () => {
    return Object.keys(games).length;
};

module.exports = {
    init: init,
    end: end,
    get: get,
    verify: verify,
    guess: guess,
    say: say,
    count: count,
};
