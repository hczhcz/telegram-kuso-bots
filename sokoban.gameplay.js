'use strict';

const config = require('./config');

const core = require('./sokoban.core');

const games = {};

const init = (id, level, onGameInit, onGameExist) => {
    if (games[id]) {
        return onGameExist();
    }

    const game = games[id] = {
        map: core.init(level),
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

    if (
        core.isBox(game.map, targetI, targetJ)
        && (
            !game.active
            || game.active[0] !== targetI
            || game.active[1] !== targetJ
        )
    ) {
        game.active = [targetI, targetJ];

        return onGameContinue(game);
    }

    if (game.active) {
        const boxI = game.active[0];
        const boxJ = game.active[1];

        game.active = null;

        if (
            game.history.length < config.sokobanMaxStep
            && core.push(game.map, boxI, boxJ, targetI, targetJ)
        ) {
            game.history.push([playerId, boxI, boxJ, targetI, targetJ]);

            if (core.win(game.map)) {
                delete games[id];

                return onGameWin(game);
            }
        }

        return onGameContinue(game);
    }

    if (
        game.history.length < config.sokobanMaxStep
        && core.move(game.map, targetI, targetJ)
    ) {
        game.history.push([playerId, targetI, targetJ]);

        return onGameContinue(game);
    }

    return onNotChanged(game);
};

module.exports = {
    init: init,
    click: click,
};
