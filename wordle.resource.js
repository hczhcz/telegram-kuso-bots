'use strict';

const fs = require('fs');
const readline = require('readline');

const config = require('./config');

const core = require('./wordle.core');

const dicts = {};

const verify = (id, onValid, onNotValid) => {
    let dictInfo = null;

    for (const i in config.wordleDict) {
        if (config.wordleDict[i].id === id) {
            dictInfo = config.wordleDict[i];

            break;
        }
    }

    if (dictInfo) {
        onValid();
    } else {
        onNotValid();
    }
};

const load = (id, size, onDone, onNotValid) => {
    let dictInfo = null;

    for (const i in config.wordleDict) {
        if (config.wordleDict[i].id === id) {
            dictInfo = config.wordleDict[i];

            break;
        }
    }

    if (dictInfo && dictInfo.size.indexOf(size) >= 0) {
        if (dicts[id + size]) {
            onDone(dicts[id + size]);
        } else {
            const rl = readline.createInterface({
                input: fs.createReadStream('wordle/' + id + '.dict'),
            });

            const dict = core.dictInit();
            let count = 0;

            for (const i in config.wordleCustomWord) {
                if (config.wordleCustomWord[i].length === size) {
                    core.dictAdd(dict, config.wordleCustomWord[i], true);
                }
            }

            rl.on('line', (line) => {
                if (line.length === size) {
                    core.dictAdd(dict, line, count < dictInfo.limit);
                }

                count += 1;
            }).on('close', () => {
                dicts[id + size] = dict;

                onDone(dict);
            });
        }
    } else {
        onNotValid();
    }
};

module.exports = {
    verify: verify,
    load: load,
};
