'use strict';

// tags
// '#' = wall
// ' ' = floor
// '.' = goal square
// '@' = player
// '+' = player on a goal square
// '$' = box
// '*' = box on a goal square

const init = (level) => {
    let top = Infinity;
    let bottom = 0;
    let left = Infinity;
    let right = 0;

    for (const i in level) {
        for (const j in level[i]) {
            if ('#.@+$*'.indexOf(level[i][j]) >= 0) {
                top = Math.min(top, i);
                bottom = Math.max(bottom, i);
                left = Math.min(left, j);
                right = Math.max(right, j);
            }
        }
    }

    const map = [];

    for (let i = top; i <= bottom; i += 1) {
        map.push([]);

        for (let j = left; j <= right; j += 1) {
            if ('# .@+$*'.indexOf(level[i][j]) >= 0) {
                map[i].push(level[i][j]);
            } else {
                map[i].push(' ');
            }
        }
    }

    return map;
};

const win = (map) => {
    let goal = false;
    let box = false;

    for (const i in map) {
        for (const j in map[i]) {
            goal = goal || map[i][j] === '.' || map[i][j] === '+';
            box = box || map[i][j] === '$';
        }
    }

    return !goal || !box;
};

const findPlayer = (map) => {
    for (let i = 0; i < map.length; i += 1) {
        for (let j = 0; j < map[i].length; j += 1) {
            if (map[i][j] === '@' || map[i][j] === '+') {
                return [i, j];
            }
        }
    }
};

const isBox = (map, i, j) => {
    return map[i][j] === '$' || map[i][j] === '*';
};

const pushPlayer = (map, i, j) => {
    if (map[i][j] === ' ') {
        map[i][j] = '@';
    } else if (map[i][j] === '.') {
        map[i][j] = '+';
    }
};

const popPlayer = (map, i, j) => {
    if (map[i][j] === '@') {
        map[i][j] = ' ';
    } else if (map[i][j] === '+') {
        map[i][j] = '.';
    }
};

const pushBox = (map, i, j) => {
    if (map[i][j] === ' ') {
        map[i][j] = '$';
    } else if (map[i][j] === '.') {
        map[i][j] = '*';
    }
};

const popBox = (map, i, j) => {
    if (map[i][j] === '$') {
        map[i][j] = ' ';
    } else if (map[i][j] === '*') {
        map[i][j] = '.';
    }
};

const findPath = (map, playerI, playerJ, targetI, targetJ) => {
    const visited = {};

    const dfs = (i, j) => {
        if (visited[i + '_' + j]) {
            return false;
        }

        visited[i + '_' + j] = true;

        if (map[i][j] === ' ' || map[i][j] === '.') {
            return i === targetI && j === targetJ
                || i - 1 >= 0 && dfs(i - 1, j)
                || i + 1 < map.length && dfs(i + 1, j)
                || j - 1 >= 0 && dfs(i, j - 1)
                || j + 1 < map[i].length && dfs(i, j + 1);
        }

        return false;
    };

    return dfs(playerI, playerJ);
};

const move = (map, targetI, targetJ) => {
    const player = findPlayer(map);
    const playerI = player[0];
    const playerJ = player[1];

    if (targetI === playerI && targetJ === playerJ) {
        return false;
    }

    popPlayer(map, playerI, playerJ);

    if (findPath(map, playerI, playerJ, targetI, targetJ)) {
        pushPlayer(map, targetI, targetJ);

        return true;
    }

    pushPlayer(map, playerI, playerJ);

    return false;
};

const push = (map, boxI, boxJ, targetI, targetJ) => {
    let deltaI = null;
    let deltaJ = null;

    if (targetJ === boxJ && targetI < boxI) {
        deltaI = -1;
        deltaJ = 0;
    } else if (targetJ === boxJ && targetI > boxI) {
        deltaI = 1;
        deltaJ = 0;
    } else if (targetI === boxI && targetJ < boxJ) {
        deltaI = 0;
        deltaJ = -1;
    } else if (targetI === boxI && targetJ > boxJ) {
        deltaI = 0;
        deltaJ = 1;
    } else {
        return false;
    }

    const player = findPlayer(map);
    const playerI = player[0];
    const playerJ = player[1];

    popPlayer(map, playerI, playerJ);

    let scanI = boxI;
    let scanJ = boxJ;

    while (scanI !== targetI || scanJ !== targetJ) {
        scanI += deltaI;
        scanJ += deltaJ;

        if (map[scanI][scanJ] !== ' ' && map[scanI][scanJ] !== '.') {
            pushPlayer(map, playerI, playerJ);

            return false;
        }
    }

    if (findPath(map, playerI, playerJ, boxI - deltaI, boxJ - deltaJ)) {
        popBox(map, boxI, boxJ);
        pushBox(map, targetI, targetJ);
        pushPlayer(map, targetI - deltaI, targetJ - deltaJ);

        return true;
    }

    pushPlayer(map, playerI, playerJ);

    return false;
};

module.exports = {
    init: init,
    win: win,
    findPlayer: findPlayer,
    isBox: isBox,
    move: move,
    push: push,
};
