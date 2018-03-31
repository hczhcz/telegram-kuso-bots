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

const makeKeyboard = (dict, str, size) => {
    const arr = splitter.splitGraphemes(str);

    for (let i = dict.charList.length - 1; i >= 0; i -= 1) {
        if (Math.random() * (i + 1) < size - arr.length) {
            arr.push(dict.charList[i]);
        }
    }

    arr.sort();

    return arr;
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
    makeKeyboard: makeKeyboard,
    guess: guess,
};
