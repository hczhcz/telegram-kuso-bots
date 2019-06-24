'use strict';

const games = {};

const init = (id, text, image, onGameInit, onGameExist) => {
    if (games[id]) {
        return onGameExist(games[id]);
    }

    games[id] = {
        text: text,
        image: image,
        history: [],
    };

    // return onGameInit(games[id]);
    return onGameInit();
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

    if (game.history.length) {
        game.history.push([playerId, game.history[game.history.length - 1][1]]);
    } else {
        game.history.push([playerId, 30]);
    }

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

const count = () => {
    return Object.keys(games).length;
};

module.exports = {
    init: init,
    verify: verify,
    next: next,
    end: end,
    tick: tick,
    count: count,
};
