'use strict';

const config = require('./config');

const core = require('./sokoban.core');

const games = {};

const setViewport = (game) => {
    const player = core.findPlayer(game.map);

    if (player[0] < game.viewport[0] + 2) {
        game.viewport[0] = Math.max(player[0] - 12 / 2, 0);
    }

    if (player[0] >= game.viewport[0] + 12 - 2) {
        game.viewport[0] = Math.min(player[0] - 12 / 2 + 1, game.map.length - 12);
    }

    if (player[1] < game.viewport[1] + 2) {
        game.viewport[1] = Math.max(player[1] - 8 / 2, 0);
    }

    if (player[1] >= game.viewport[1] + 8 - 2) {
        game.viewport[1] = Math.min(player[1] - 8 / 2 + 1, game.map[player[0]].length - 8);
    }
};

const doMove = (game, playerId, targetI, targetJ) => {
    if (
        game.history.length < config.sokobanMaxStep
        && core.move(game.map, targetI, targetJ)
    ) {
        game.history.push([playerId, targetI, targetJ]);

        return true;
    }

    return false;
};

const doPush = (game, playerId, boxI, boxJ, targetI, targetJ) => {
    if (
        game.history.length < config.sokobanMaxStep
        && core.push(game.map, boxI, boxJ, targetI, targetJ)
    ) {
        game.history.push([playerId, boxI, boxJ, targetI, targetJ]);

        return true;
    }

    return false;
};

const doReplay = (game, history) => {
    for (const i in history) {
        if (history[i].length === 3) {
            if (
                typeof history[i][1] !== 'number'
                || typeof history[i][2] !== 'number'
                || !doMove(
                    game,
                    history[i][0],
                    history[i][1],
                    history[i][2]
                )
            ) {
                break;
            }
        } else if (history[i].length === 5) {
            if (
                typeof history[i][1] !== 'number'
                || typeof history[i][2] !== 'number'
                || typeof history[i][3] !== 'number'
                || typeof history[i][4] !== 'number'
                || !doPush(
                    game,
                    history[i][0],
                    history[i][1],
                    history[i][2],
                    history[i][3],
                    history[i][4]
                )
            ) {
                break;
            }
        } else {
            break;
        }
    }
};

const init = (id, level, levelId, levelIndex, history, onGameInit, onGameExist) => {
    if (games[id]) {
        return onGameExist();
    }

    const game = games[id] = {
        level: level,
        levelId: levelId,
        levelIndex: levelIndex,
        map: core.init(level),
        active: null,
        viewport: [0, 0],
        history: [],
    };

    if (history) {
        doReplay(game, history);
    }

    setViewport(game);

    return onGameInit(game);
};

const get = (id, onDone, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    return onDone(game);
};

const click = (id, playerId, targetI, targetJ, onGameContinue, onGameStep, onGameWin, onNotChanged, onGameNotExist) => {
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

        if (doPush(game, playerId, boxI, boxJ, targetI, targetJ)) {
            setViewport(game);

            if (core.win(game.map)) {
                delete games[id];

                return onGameWin(game);
            }

            game.active = [targetI, targetJ];

            return onGameStep(game);
        }

        if (
            boxI >= game.viewport[0]
            && boxI < game.viewport[0] + 12
            && boxJ >= game.viewport[1]
            && boxJ < game.viewport[1] + 8
        ) {
            return onGameContinue(game);
        }
    }

    if (doMove(game, playerId, targetI, targetJ)) {
        setViewport(game);

        return onGameStep(game);
    }

    return onNotChanged(game);
};

const undo = (id, onDone, onNotValid, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    if (!game.history.length) {
        return onNotValid();
    }

    const history = game.history;

    history.length -= 1;

    game.map = core.init(game.level);
    game.active = null;
    game.viewport = [0, 0];
    game.history = [];

    doReplay(game, history);

    setViewport(game);

    return onDone(game);
};

module.exports = {
    init: init,
    get: get,
    click: click,
    undo: undo,
};
