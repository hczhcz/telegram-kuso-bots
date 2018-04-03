'use strict';

const fs = require('fs');
const readline = require('readline');

const config = require('./config');

const core = require('./hangman.core');

const dicts = {};

const load = (id, limit, onDone, onNotValid) => {
    let dictInfo = null;

    for (const i in config.hangmanDict) {
        if (config.hangman[i].id === id) {
            dictInfo = config.hangmanDict[i];

            break;
        }
    }

    if (dictInfo) {
        if (dicts[id + '_' + limit]) {
            onDone(dicts[id + '_' + limit]);
        } else {
            const rl = readline.createInterface({
                input: fs.createReadStream('hangman/' + id + '.dict'),
            });

            const dict = core.dictInit();

            rl.on('line', (str) => {
                if (dict.strList.length < limit) {
                    core.dictAdd(dict, str);
                }
            });

            rl.on('close', () => {
                dicts[id + '_' + limit] = dict;

                onDone(dict);
            });
        }
    } else {
        onNotValid();
    }
};

module.exports = {
    load: load,
};
