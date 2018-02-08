'use strict';

const config = require('./config');

const core = require('./1a2b.core');

const games = {};
const meows = {};

const normalInit = (text) => {
    const all = text.split(/[\n\r]+/);
    const list = [];

    for (const i in all) {
        const str = all[i].split(/\s+/).join('');

        if (str && list.indexOf(str) < 0) {
            list.push(str);
        }
    }

    return list;
};

const normalGet = (list) => {
    return list[Math.floor(Math.random() * list.length)];
};

const normalHint = (charset) => {
    return charset;
};

const meowInit = (meowId, text) => {
    meows[meowId] = normalGet(normalInit(text));
};

const meowGet = (meowId) => {
    const charset = meows[meowId];

    delete meows[meowId];

    return charset;
};

const meowHint = (charset) => {
    return '喵'.repeat(core.length(charset));
};

const init = (id, text, meowId, limit, onGameInit, onGameExist) => {
    // charset selection order: argument -> reply -> meow -> default

    if (games[id]) {
        return onGameExist();
    }

    const game = games[id] = {
        charset: null,
        answer: null,
        hint: null,
        active: true,
        guess: {},
    };

    const ok = () => {
        return game.charset && core.length(game.charset) <= limit;
    };

    const list = normalInit(text);

    if (list.length > 1) {
        game.charset = normalGet(list);
        game.hint = meowHint(game.charset);
    } else if (list.length > 0) {
        game.charset = normalGet(list);
        game.hint = normalHint(game.charset);
    }

    if (!ok() && meows[meowId]) {
        game.charset = meowGet(meowId);
        game.hint = meowHint(game.charset);
    }

    if (!ok()) {
        game.charset = '1234567890';
        game.hint = '1234567890';
    }

    return onGameInit(game);
};

const end = (id, onGameEnd, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    delete game.hint;
    delete game.active;

    delete games[id];

    return onGameEnd(game);
};

const verify = (id, str, onValid, onNotValid, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    if (game.answer) {
        if (core.length(str) === core.length(game.answer) && !core.extraChar(str, game.charset)) {
            return onValid();
        }

        return onNotValid();
    }

    if (core.length(str) <= config.abMaxLength && !core.extraChar(str, game.charset)) {
        game.answer = core.shuffle(game.charset, core.length(str));

        return onValid();
    }

    return onNotValid();
};

const guess = (id, str, onGuess, onGameEnd, onGuessDuplicated, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    if (game.guess['#' + str]) {
        return onGuessDuplicated();
    }

    game.hint = core.reveal(str, game.hint, game.charset);
    game.guess['#' + str] = core.getAB(str, game.answer);

    if (Object.keys(game.guess).length > config.abMaxGuessLength) {
        for (const i in game.guess) {
            delete game.guess[i]; // delete the first

            break;
        }
    }

    if (game.guess['#' + str][0] === core.length(game.answer)) {
        return end(id, onGameEnd, onGameNotExist);
    }

    return onGuess(game);
};

module.exports = {
    meowInit: meowInit,
    init: init,
    end: end,
    verify: verify,
    guess: guess,
};
