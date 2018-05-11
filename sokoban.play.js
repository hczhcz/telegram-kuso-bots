'use strict';

const config = require('./config');

const core = require('./sokoban.core');

const games = {};

const setViewport = (game) => {
    const player = core.findPlayer(game.map);

    if (player[0] < game.viewport[0] + 2) {
        game.viewport[0] = Math.max(player[0] - 6, 0);
    }

    if (player[0] >= game.viewport[0] + 10) {
        game.viewport[0] = Math.min(player[0] - 5, game.map.length - 12);
    }

    if (player[1] < game.viewport[1] + 2) {
        game.viewport[1] = Math.max(player[1] - 4, 0);
    }

    if (player[1] >= game.viewport[1] + 6) {
        game.viewport[1] = Math.min(player[1] - 3, game.map[player[0]].length - 8);
    }
};

const init = (id, level, levelId, levelIndex, onGameInit, onGameExist) => {
    if (games[id]) {
        return onGameExist();
    }

    const game = games[id] = {
        levelId: levelId,
        levelIndex: levelIndex,
        map: core.init(level),
        active: null,
        viewport: [0, 0],
        history: [],
    };

    setViewport(game);

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

            setViewport(game);

            if (core.win(game.map)) {
                delete games[id];

                return onGameWin(game);
            }

            return onGameContinue(game);
        }

        // TODO: check if [boxI, boxJ] is in viewport
        return onGameContinue(game);
    }

    if (
        game.history.length < config.sokobanMaxStep
        && core.move(game.map, targetI, targetJ)
    ) {
        game.history.push([playerId, targetI, targetJ]);

        setViewport(game);

        return onGameContinue(game);
    }

    return onNotChanged(game);
};

module.exports = {
    init: init,
    click: click,
};
