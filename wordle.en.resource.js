'use strict';

const fs = require('fs');
const readline = require('readline');

const config = require('./config');

const core = require('./wordle.en.core');

const dicts = {};

const verify = (id, onValid, onNotValid) => {
    let dictInfo = null;

    for (const i in config.wordleEnDict) {
        if (config.wordleEnDict[i].id === id) {
            dictInfo = config.wordleEnDict[i];

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

    for (const i in config.wordleEnDict) {
        if (config.wordleEnDict[i].id === id) {
            dictInfo = config.wordleEnDict[i];

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

            for (const i in config.wordleEnCustomWord) {
                if (config.wordleEnCustomWord[i].length === size) {
                    core.dictAdd(dict, config.wordleEnCustomWord[i], true);
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
