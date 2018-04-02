'use strict';

const GraphemeSplitter = require('grapheme-splitter');

const splitter = new GraphemeSplitter();

const length = (str) => {
    const arr = splitter.splitGraphemes(str);

    return arr.length;
};

const dictInit = () => {
    return {
        strList: [],
        charList: [],
        strSet: {},
        charSet: {},
    };
};

const dictAdd = (dict, str) => {
    if (!dict.strSet[str]) {
        dict.strSet[str] = true;
        dict.strList.push(str);

        const arr = splitter.splitGraphemes(str);

        for (const i in arr) {
            if (!dict.charSet[arr[i]]) {
                dict.charSet[arr[i]] = true;
                dict.charList.push(arr[i]);
            }
        }
    }
};

const dictFinalize = (dict) => {
    delete dict.strSet;
    delete dict.charSet;
};

const dictSelect = (dict) => {
    return dict.strList[Math.floor(Math.random() * dict.strList.length)];
};

const makeKeyboard = (dict, str, size) => {
    const arr = splitter.splitGraphemes(str);
    const keyboard = {};

    for (const i in arr) {
        if (!keyboard[arr[i]]) {
            keyboard[arr[i]] = true;
            size -= 1;
        }
    }

    for (let i = dict.charList.length - 1; i >= 0; i -= 1) {
        if (Math.random() * (i + 1) < size && !keyboard[dict.charList[i]]) {
            keyboard[dict.charList[i]] = true;
            size -= 1;
        }
    }

    Object.keys(keyboard).sort().forEach((char, i, list) => {
        keyboard[char] = i;
    });

    return keyboard;
};

const guess = (str, strH, char) => {
    const arr = splitter.splitGraphemes(str);
    const arrH = splitter.splitGraphemes(strH);

    for (let i = 0; i < arr.length; i += 1) {
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
    dictFinalize: dictFinalize,
    dictSelect: dictSelect,
    makeKeyboard: makeKeyboard,
    guess: guess,
};
