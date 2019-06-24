'use strict';

const games = {};

const init = (id, player, text, image, onGameInit, onGameExist) => {
    if (games[id]) {
        return onGameExist(games[id]);
    }

    games[id] = {
        text: text,
        image: image,
        player: player,
        history: [[player.id, 30]],
    };

    return onGameInit(games[id]);
};

const verify = (id, player, image, onValid, onWrongPlayer, onNotValid, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    if (game.image === image) {
        if (player.id === game.player.id) {
            return onValid();
        }

        return onWrongPlayer();
    }

    return onNotValid();
};

const next = (id, player, onGameContinue, onGameEnd, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    game.player = player;
    game.history.push([player.id, game.history[game.history.length - 1][1]]);

    onGameContinue(game);
};

const end = (id, player, onGameEnd, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    game.history.push([player.id]);

    delete game.player;

    delete games[id];

    return onGameEnd(game);
};

const tick = (onGameEnd) => {
    for (const i in games) {
        const game = games[i];

        game.history[game.history.length - 1][1] -= 1;

        if (game.history[game.history.length - 1][1] === 0) {
            const player = game.player;

            delete game.player;

            delete games[i];

            onGameEnd(i, game, player);
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
