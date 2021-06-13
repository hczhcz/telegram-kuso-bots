'use strict';

const core = require('./minesweeper.core');

const games = {};

const init = (id, rows, columns, mines, onGameInit, onNotValid, onGameExist) => {
    if (games[id]) {
        return onGameExist();
    }

    if (core.verify(rows, columns, mines)) {
        games[id] = {
            rows: rows,
            columns: columns,
            mines: mines,
            map: null,
            timeBegin: null,
            timeEnd: null,
            history: [],
            analysis: null,
        };

        return onGameInit(games[id]);
    }

    return onNotValid();
};

const click = (id, playerId, targetI, targetJ, onGameContinue, onGameWin, onGameLose, onNotChanged, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    if (!game.map) {
        game.map = core.init(game.rows, game.columns, game.mines, targetI, targetJ);
        game.timeBegin = Date.now();
    }

    if (core.click(game.map, targetI, targetJ)) {
        game.history.push([playerId, targetI, targetJ]);

        game.analysis = core.analysis(game.map);

        const result = core.status(game.map);

        if (result === 'normal') {
            return onGameContinue(game);
        }

        if (result === 'win') {
            game.timeEnd = Date.now();

            delete games[id];

            return onGameWin(game);
        }

        if (result === 'lose') {
            game.timeEnd = Date.now();

            delete games[id];

            return onGameLose(game);
        }

        // never reach
        throw Error();
    }

    return onNotChanged(game);
};

const count = () => {
    return Object.keys(games).length;
};

module.exports = {
    init: init,
    click: click,
    count: count,
};
