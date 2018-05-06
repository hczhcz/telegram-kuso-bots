'use strict';

const core = require('./sokoban.core');

const games = {};

const init = (id, list, onGameInit, onGameExist) => {
    if (games[id]) {
        return onGameExist();
    }

    const game = games[id] = {
        map: core.init(list),
        active: null,
        history: [],
    };

    return onGameInit(game);
};

const click = (id, playerId, targetI, targetJ, onGameContinue, onGameWin, onNotChanged, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    if (game.active) {
        const boxI = game.active[0];
        const boxJ = game.active[1];

        game.active = null;

        if (core.push(game.map, boxI, boxJ, targetI, targetJ)) {
            game.history.push([playerId, targetI, targetJ]);

            if (core.win(game.map)) {
                return onGameWin(game);
            } else {
                return onGameContinue(game);
            }
        } else {
            game.history.push([playerId, targetI, targetJ]);

            return onGameContinue(game);
        }
    } else if (core.move(game.map, targetI, targetJ)) {
        game.history.push([playerId, targetI, targetJ]);

        return onGameContinue(game);
    }

    return onNotChanged(game);
};

module.exports = {
    init: init,
    click: click,
};
