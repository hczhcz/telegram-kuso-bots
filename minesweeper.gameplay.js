'use strict';

const core = require('./minesweeper.core');

const games = {};

const init = (id, rows, columns, mines, onGameInit, onGameExist, onNotValid) => {
    if (games[id]) {
        return onGameExist();
    }

    if (core.verify(rows, columns, mines)) {
        const game = games[id] = {
            rows: rows,
            columns: columns,
            mines: mines,
            map: null,
            history: [],
        };

        return onGameInit(game);
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
    }

    if (core.click(game.map, targetI, targetJ)) {
        game.history.push([playerId, targetI, targetJ]);

        const result = core.status(game.map);

        if (result === 'normal') {
            onGameContinue(game);
        } else if (result === 'win') {
            delete games[id];

            onGameWin(game);
        } else if (result === 'lose') {
            delete games[id];

            onGameLose(game);
        } else {
            // never reach
            throw Error(result);
        }
    } else {
        onNotChanged(game);
    }
};

module.exports = {
    init: init,
    click: click,
};
