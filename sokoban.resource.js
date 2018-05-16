'use strict';

const fs = require('fs');
const readline = require('readline');

const levelNames = fs.readdirSync('sokoban');
const levels = {};

for (const i in levelNames) {
    if (levelNames[i].slice(levelNames[i].length - 4) !== '.txt') {
        throw Error(JSON.stringify(levelNames));
    }
    levelNames[i] = levelNames[i].slice(0, levelNames[i].length - 4);
}

const load = (id, index, onDone, onNotValid) => {
    let levelId = null;
    let levelIndex = null;

    if (id) {
        for (const i in levelNames) {
            if (levelNames[i] === id) {
                levelId = id;

                break;
            }
        }
    } else {
        levelId = levelNames[Math.floor(Math.random() * levelNames.length)];
    }

    if (levelId) {
        const choose = () => {
            if (index === null) {
                levelIndex = Math.floor(Math.random() * levels[levelId].length);
            } else if (index >= 0 && index < levels[levelId].length) {
                levelIndex = index;
            }

            if (levelIndex === null) {
                onNotValid();
            } else {
                onDone(levels[levelId][levelIndex], levelId, levelIndex);
            }
        };

        if (levels[levelId]) {
            choose();
        } else {
            const rl = readline.createInterface({
                input: fs.createReadStream('sokoban/' + levelId + '.txt'),
            });

            let buffer = [];
            const levelList = [];

            rl.on('line', (str) => {
                const match = str.match(/^([# .@+$*]+)(?: *;.*)?\r?$/);

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

                levels[levelId] = levelList;

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
