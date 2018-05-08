'use strict';

const fs = require('fs');
const readline = require('readline');

const config = require('./config');

const levels = {};

const load = (id, index, onDone, onNotValid) => {
    let found = false;

    for (const i in config.sokobanLevel) {
        if (config.sokobanLevel[i] === id) {
            found = true;

            break;
        }
    }

    if (found) {
        const choose = () => {
            if (index === null) {
                index = Math.floor(Math.random() * levelInfo.list.length);
            }

            if (index >= 0 && index < levels[id].length) {
                onDone(levels[id][index]);
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

            const buffer = [];
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
