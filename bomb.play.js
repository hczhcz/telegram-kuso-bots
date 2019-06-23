'use strict';

const games = {};

const init = (id, playerId, text, image, onGameInit, onGameExist) => {
    if (games[id]) {
        return onGameExist(games[id]);
    }

    games[id] = {
        text: text,
        image: image,
        history: [playerId, 30],
    };

    return onGameInit(games[id]);
};

const verify = (id, image, onValid, onNotValid, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    if (game.image === image) {
        return onValid();
    }

    return onNotValid();
};

const next = (id, playerId, onGameContinue, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    game.history.push([playerId, game.history[game.history.length - 1][1]]);

    onGameContinue(game);
};

const end = (id, playerId, onGameEnd, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    game.history.push([playerId]);

    delete games[id];

    return onGameEnd(game);
};

const tick = (onGameEnd) => {
    for (const i in games) {
        const game = games[i];

        game.history[game.history.length - 1][1] -= 1;

        if (game.history[game.history.length - 1][1] === 0) {
            delete games[i];

            onGameEnd(i, game);
        }
    }
};

module.exports = {
    init: init,
    verify: verify,
    next: next,
    end: end,
    tick: tick,
};
