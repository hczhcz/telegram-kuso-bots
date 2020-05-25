'use strict';

// tags
// 's' = space
// 'S' = space with flag
// 'm' = mine
// 'M' = mine with flag
// 0-8 = opened space
// '*' = opened mine

const verify = (rows, columns, mines) => {
    // note: telegram's limit
    return rows > 0 && columns > 0 && mines > 0
        && rows * columns <= 100 && columns <= 8 && mines < rows * columns;
};

const init = (rows, columns, mines, targetI, targetJ) => {
    const map = [];

    let space = rows * columns - 1;
    let remain = mines;

    for (let i = 0; i < rows; i += 1) {
        map.push([]);

        for (let j = 0; j < columns; j += 1) {
            if (i === targetI && j === targetJ) {
                map[i].push('s');
            } else if (Math.random() * space < remain) {
                map[i].push('m');
                space -= 1;
                remain -= 1;
            } else {
                map[i].push('s');
                space -= 1;
            }
        }
    }

    return map;
};

const status = (map) => {
    let lose = false;
    let normal = false;

    for (const i in map) {
        for (const j in map[i]) {
            if (map[i][j] === 'S' || map[i][j] === 's') {
                normal = true;
            } else if (map[i][j] === '*') {
                lose = true;
            }
        }
    }

    if (lose) {
        return 'lose';
    }

    if (normal) {
        return 'normal';
    }

    return 'win';
};

const flag = (map, targetI, targetJ) => {
    switch (map[targetI][targetJ]) {
        case 'S':
            map[targetI][targetJ] = 's';

            return true;
        case 's':
            map[targetI][targetJ] = 'S';

            return true;
        case 'M':
            map[targetI][targetJ] = 'm';

            return true;
        case 'm':
            map[targetI][targetJ] = 'M';

            return true;
        default:
            return false;
    }
};

const click = (map, targetI, targetJ) => {
    const scan = (task) => {
        for (let i = targetI - 1; i <= targetI + 1; i += 1) {
            for (let j = targetJ - 1; j <= targetJ + 1; j += 1) {
                if (
                    (i !== targetI || j !== targetJ)
                    && i >= 0 && i < map.length
                    && j >= 0 && j < map[i].length
                ) {
                    task(i, j, map[i][j]);
                }
            }
        }
    };

    if (map[targetI][targetJ] === 's') {
        let nearMine = 0;

        scan((i, j, value) => {
            if (value === 'M' || value === 'm' || value === '*') {
                nearMine += 1;
            }
        });

        map[targetI][targetJ] = nearMine;

        if (nearMine === 0) {
            scan((i, j, value) => {
                if (value === 'S' || value === 's') {
                    click(map, i, j);
                }
            });
        }

        return true;
    }

    if (map[targetI][targetJ] === 'm') {
        map[targetI][targetJ] = '*';

        return true;
    }

    if (map[targetI][targetJ] >= 0 && map[targetI][targetJ] <= 8) {
        // TODO: option?

        let nearFlag = 0;
        let nearUnflag = 0;

        scan((i, j, value) => {
            if (value === 'S' || value === 'M') {
                nearFlag += 1;
            } else if (value === 's' || value === 'm') {
                nearUnflag += 1;
            }
        });

        if (!nearUnflag) {
            return false;
        }

        if (nearFlag + nearUnflag === map[targetI][targetJ]) {
            scan((i, j, value) => {
                if (value === 's' || value === 'm') {
                    flag(map, i, j);
                }
            });

            return true;
        }

        if (nearFlag === map[targetI][targetJ]) {
            scan((i, j, value) => {
                if (value === 's' || value === 'm') {
                    click(map, i, j);
                }
            });

            return true;
        }
    }

    return false;
};

const analysis = (map) => {
    let open = 0;
    let island = 0;
    let bbbv = 0;

    const visited = [];

    const scanOpen = (targetI, targetJ) => {
        visited[targetI][targetJ] = true;

        for (let i = targetI - 1; i <= targetI + 1; i += 1) {
            for (let j = targetJ - 1; j <= targetJ + 1; j += 1) {
                if (
                    (i !== targetI || j !== targetJ)
                    && i >= 0 && i < map.length
                    && j >= 0 && j < map[i].length
                    && !visited[i][j]
                ) {
                    if (map[i][j] === 0) {
                        scanOpen(i, j);
                    } else if (map[i][j] >= 1 && map[i][j] <= 8) {
                        visited[i][j] = true;
                    }
                }
            }
        }
    };

    const scanIsland = (targetI, targetJ) => {
        bbbv += 1;
        visited[targetI][targetJ] = true;

        for (let i = targetI - 1; i <= targetI + 1; i += 1) {
            for (let j = targetJ - 1; j <= targetJ + 1; j += 1) {
                if (
                    (i !== targetI || j !== targetJ)
                    && i >= 0 && i < map.length
                    && j >= 0 && j < map[i].length
                    && !visited[i][j]
                ) {
                    if (map[i][j] >= 1 && map[i][j] <= 8) {
                        scanIsland(i, j);
                    }
                }
            }
        }
    };

    for (let i = 0; i < map.length; i += 1) {
        visited.push([]);

        for (let j = 0; j < map[i].length; j += 1) {
            visited[i].push(false);
        }
    }

    for (let i = 0; i < map.length; i += 1) {
        for (let j = 0; j < map[i].length; j += 1) {
            if (!visited[i][j] && map[i][j] === 0) {
                open += 1;
                bbbv += 1;

                scanOpen(i, j);
            }
        }
    }

    for (let i = 0; i < map.length; i += 1) {
        for (let j = 0; j < map[i].length; j += 1) {
            if (!visited[i][j] && map[i][j] >= 1 && map[i][j] <= 8) {
                island += 1;

                scanIsland(i, j);
            }
        }
    }

    return {
        open: open,
        island: island,
        bbbv: bbbv,
    };
};

module.exports = {
    verify: verify,
    init: init,
    status: status,
    flag: flag,
    click: click,
    analysis: analysis,
};
