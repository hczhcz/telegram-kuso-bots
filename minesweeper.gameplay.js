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
    } else {
        return onNotValid();
    }
};

const click = (id, playerId, targetI, targetJ, onGameContinue, onGameWin, onGameLose, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    if (!game.map) {
        game.map = core.init(game.rows, game.columns, game.mines, targetI, targetJ);
    }

    core.click(game.map, targetI, targetJ);
    game.history.push([playerId, targetI, targetJ]);

    const result = core.status(game.map);

    if (result === 'normal') {
        onGameContinue(game);
    } else if (result === 'win') {
        onGameWin(game);
    } else if (result === 'lose') {
        onGameLose(game);
    } else {
        // never reach
        throw Error(result);
    }
};

module.exports = {
    init: init,
    click: click,
};
