'use strict';

const fs = require('fs');
const readline = require('readline');

const config = require('./config');

const core = require('./wordle.cn.core');

const dicts = {};

const verify = (id, onValid, onNotValid) => {
    let dictInfo = null;

    for (const i in config.wordleCnDict) {
        if (config.wordleCnDict[i].id === id) {
            dictInfo = config.wordleCnDict[i];

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

    for (const i in config.wordleCnDict) {
        if (config.wordleCnDict[i].id === id) {
            dictInfo = config.wordleCnDict[i];

            break;
        }
    }

    if (dictInfo && dictInfo.size.indexOf(size) >= 0) {
        if (dicts[id + size]) {
            onDone(dictInfo, dicts[id + size]);
        } else {
            const rl = readline.createInterface({
                input: fs.createReadStream('wordle/' + id + '.dict'),
            });

            const dict = core.dictInit();

            for (const i in config.wordleCnCustomWord) {
                if (config.wordleCnCustomWord[i].length === size) {
                    core.dictAdd(dict, config.wordleCnCustomWord[i], true);
                }
            }

            rl.on('line', (line) => {
                if (line.length === size) {
                    core.dictAdd(dict, line, true);
                }
            }).on('close', () => {
                dicts[id + size] = dict;

                onDone(dictInfo, dict);
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
