'use strict';

const fs = require('fs');
const readline = require('readline');

const config = require('./config');

const core = require('./hangman.core');

const load = (dictName, limit, onDone, onNotValid) => {
    let valid = false;

    for (const i in config.hangmanDict) {
        if (i === dictName) {
            valid = true;
            break;
        }
    }

    if (!valid) {
        onNotValid();
    }

    const rl = readline.createInterface({
        input: fs.createReadStream('hangman/' + dictName + '.dict'),
    });

    const dict = core.dictInit();

    rl.on('line', (str) => {
        core.dictAdd(dict, str);
    });

    rl.on('close', () => {
        onDone(dict);
    });
};

module.exports = {
    load: load,
};
