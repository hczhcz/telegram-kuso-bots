'use strict';

const GraphemeSplitter = require('grapheme-splitter');

const splitter = new GraphemeSplitter();

const length = (str) => {
    const arr = splitter.splitGraphemes(str);

    return arr.length;
};

const dictInit = () => {
    return {
        list: [],
        charset: {},
        charsetSize: 0,
    };
};

const dictAdd = (dict, str) => {
    dict.list.push(str);

    const arr = splitter.splitGraphemes(str);

    for (const i in arr) {
        if (!dict.charset[arr[i]]) {
            dict.charset[arr[i]] = true;
            dict.charsetSize += 1;
        }
    }
};

const dictSelect = (dict) => {
    return dict.list[Math.floor(Math.random() * dict.list.length)];
};

const makeKeyboard = (dict, str, size) => {
    const arr = splitter.splitGraphemes(str);
    const keyboard = {};
    let keyboardSize = 0;

    let remain = dict.charsetSize;

    for (const i in arr) {
        if (!keyboard[arr[i]]) {
            keyboard[arr[i]] = true;
            keyboardSize += 1;

            if (dict.charset[arr[i]]) {
                remain -= 1;
            }
        }
    }

    for (const i in dict.charset) {
        if (!keyboard[i]) {
            if (Math.random() * remain < size - keyboardSize) {
                keyboard[i] = true;
                keyboardSize += 1;
            }

            remain -= 1;
        }
    }

    if (remain) {
        // never reach
        throw Error();
    }

    return Object.keys(keyboard).sort();
};

const guess = (str, strH, char) => {
    const arr = splitter.splitGraphemes(str);
    const arrH = splitter.splitGraphemes(strH);

    for (const i in arr) {
        if (arr[i] === char) {
            arrH[i] = char;
        }
    }

    return arrH.join('');
};

module.exports = {
    length: length,
    dictInit: dictInit,
    dictAdd: dictAdd,
    dictSelect: dictSelect,
    makeKeyboard: makeKeyboard,
    guess: guess,
};
