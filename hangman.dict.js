'use strict';

const fs = require('fs');
const readline = require('readline');

const config = require('./config');

const core = require('./hangman.core');

const load = (id, onDone, onNotValid) => {
    let dictInfo = null;

    for (const i in config.hangmanDict) {
        if (config.hangman[i].id === id) {
            dictInfo = config.hangman[i];

            break;
        }
    }

    if (dictInfo) {
        const rl = readline.createInterface({
            input: fs.createReadStream('hangman/' + id + '.dict'),
        });

        const dict = core.dictInit();

        rl.on('line', (str) => {
            core.dictAdd(dict, str);
        });

        rl.on('close', () => {
            onDone(dict);
        });
    } else {
        onNotValid();
    }
};

module.exports = {
    load: load,
};
