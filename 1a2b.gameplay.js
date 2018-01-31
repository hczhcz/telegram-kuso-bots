'use strict';

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

const init = (id, text, meowId, limit, onDone, onGameExist) => {
    // charset selection order: argument -> reply -> meow -> default

    if (games[id]) {
        return onGameExist();
    } else {
        const game = games[id] = {
            charset: null,
            answer: null,
            hint: null,
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

        return onDone();
    }
};

const verify = (id, text, onValid, onNotValid, onGameNotExist) => {
    if (games[id]) {
        const game = games[id];

        if (game.answer) {
            if (core.length(text) === core.length(game.answer) && !core.extraChar(text, game.charset)) {
                return onValid();
            } else {
                return onNotValid();
            }
        } else {
            if (core.length(text) <= config.abMaxLength && !core.extraChar(text, game.charset)) {
                game.answer = core.shuffle(game.charset, core.length(text));

                return onValid();
            } else {
                return onNotValid();
            }
        }
    } else {
        return onGameNotExist();
    }
};

module.exports = {
    meowInit: meowInit,
    init: init,
    verify: verify,
};
