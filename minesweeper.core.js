'use strict';

// tags
// 's' = space
// 'S' = space with flag
// 'm' = mine
// 'M' = mine with flag
// 0-8 = opened space
// '*' = opened mine

const verify = (rows, columns, mines) => {
    return rows > 0 && columns > 0 && mines > 0
        && rows <= 16 && columns <= 8 && mines <= rows * columns - 1;
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

    for (let i = 0; i < map.length; i += 1) {
        for (let j = 0; j < map[i].length; j += 1) {

        }
    }

    for (let i = 0; i < map.length; i += 1) {
        for (let j = 0; j < map[i].length; j += 1) {
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
    } else if (map[targetI][targetJ] === 'm') {
        map[targetI][targetJ] = '*';

        return true;
    } else if (map[targetI][targetJ] >= 0 && map[targetI][targetJ] <= 8) {
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
        } else if (nearFlag === map[targetI][targetJ]) {
            scan((i, j, value) => {
                if (value === 's' || value === 'm') {
                    click(map, i, j);
                }
            });
        }

        return true;
    }

    return false;
};

module.exports = {
    verify: verify,
    init: init,
    status: status,
    flag: flag,
    click: click,
};
