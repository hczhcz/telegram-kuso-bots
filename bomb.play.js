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

const verify = (id, playerId, image, onValid, onNotValid, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    if (game.image === image) {
        game.history.push([playerId, game.history[game.history.length - 1][1]]);

        return onValid();
    }

    return onNotValid();
};

const end = (id, onGameEnd, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    delete games[id];

    return onGameEnd(game);
};

const tick = (onGameEnd) => {
    for (const i in games) {
        const game = games[i];

        game.history[game.history.length - 1][1] -= 1;

        if (game.history[game.history.length - 1][1] === 0) {
            delete games[i];

            onGameEnd(game);
        }
    }
};

module.exports = {
    init: init,
    verify: verify,
    end: end,
    tick: tick,
};
