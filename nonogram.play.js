'use strict';

const core = require('./nonogram.core');

const games = {};

const init = (id, rows, columns, boxes, correct, onGameInit, onNotValid, onGameExist) => {
    if (games[id]) {
        return onGameExist();
    }

    if (core.verify(rows, columns, boxes)) {
        games[id] = {
            rows: rows,
            columns: columns,
            boxes: boxes,
            correct: correct,
            map: core.init(rows, columns, boxes, correct),
            history: [],
        };

        return onGameInit(games[id]);
    }

    return onNotValid();
};

const click = (id, playerId, targetI, targetJ, onGameContinue, onGameWin, onNotChanged, onGameNotExist) => {
    if (!games[id]) {
        return onGameNotExist();
    }

    const game = games[id];

    if (core.click(game.map, game.correct, targetI, targetJ)) {
        game.history.push([playerId, targetI, targetJ, game.map[targetI][targetJ] === game.correct]);

        if (core.finished(game.map, game.correct)) {
            delete games[id];

            return onGameWin(game);
        }

        return onGameContinue(game);
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
