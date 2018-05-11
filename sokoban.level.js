'use strict';

const fs = require('fs');
const readline = require('readline');

const levelNames = fs.readdirSync('sokoban');
const levels = {};

const load = (id, index, onDone, onNotValid) => {
    let found = false;

    for (const i in levelNames) {
        if (levelNames[i] === id + '.txt') {
            found = true;

            break;
        }
    }

    if (found) {
        const choose = () => {
            let i = index;

            if (i === null) {
                i = Math.floor(Math.random() * levels[id].length);
            }

            if (i >= 0 && i < levels[id].length) {
                onDone(levels[id][i]);
            } else {
                onNotValid();
            }
        };

        if (levels[id]) {
            choose();
        } else {
            const rl = readline.createInterface({
                input: fs.createReadStream('sokoban/' + id + '.txt'),
            });

            let buffer = [];
            const levelList = [];

            rl.on('line', (str) => {
                const match = str.match(/^([# .@+$*]+)(?: *;.*)?$/);

                if (match) {
                    buffer.push(match[1]);
                } else if (buffer.length) {
                    levelList.push(buffer);
                    buffer = [];
                }
            });

            rl.on('close', () => {
                if (buffer.length) {
                    levelList.push(buffer);
                }

                levels[id] = levelList;

                choose();
            });
        }
    } else {
        onNotValid();
    }
};

module.exports = {
    load: load,
};
