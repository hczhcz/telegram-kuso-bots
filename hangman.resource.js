'use strict';

const fs = require('fs');
const readline = require('readline');

const config = require('./config');

const core = require('./hangman.core');

const dicts = {};

const load = (id, limit, onDone, onNotValid) => {
    let dictInfo = null;

    for (const i in config.hangmanDict) {
        if (config.hangmanDict[i].id === id) {
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

            rl.on('line', (line) => {
                if (!limit || dict.list.length < limit) {
                    core.dictAdd(dict, line);
                }
            }).on('close', () => {
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
