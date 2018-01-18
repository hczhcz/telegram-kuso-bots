'use strict';

const GraphemeSplitter = require('grapheme-splitter');

const splitter = new GraphemeSplitter()

const length = (str) => {
    const arr = splitter.splitGraphemes(str);

    return arr.length;
};

const shuffle = (str, total) => {
    const arr = splitter.splitGraphemes(str);

    let result = '';

    for (let i = 0; i < total; i += 1) {
        const j = Math.floor(Math.random() * arr.length);

        result += arr[j];
        arr[j] = arr[arr.length - 1];
        arr.pop();
    }

    return result;
};

const extraChar = (str, str2) => {
    const arr = splitter.splitGraphemes(str);
    const arr2 = splitter.splitGraphemes(str2);

    for (let i = 0; i < arr2.length; i += 1) {
        const j = arr.indexOf(arr2[i]);

        if (j >= 0) {
            arr[j] = arr[arr.length - 1];
            arr.pop();
        }
    }

    return arr.length;
};

const reveal = (str, strH, strC) => {
    const arr = splitter.splitGraphemes(str);
    const arrH = splitter.splitGraphemes(strH);
    const arrC = splitter.splitGraphemes(strC);

    for (let i = 0; i < arrC.length; i += 1) {
        const j = arr.indexOf(arrC[i]);

        if (j >= 0) {
            arrH[i] = arrC[i];
            arr[j] = arr[arr.length - 1];
            arr.pop();
        }
    }

    return arrH.join('');
};

const getA = (str, str2) => {
    const arr = splitter.splitGraphemes(str);
    const arr2 = splitter.splitGraphemes(str2);

    let result = 0;

    for (let i = 0; i < arr2.length; i += 1) {
        if (arr2[i] === arr[i]) {
            result += 1;
        }
    }

    return result;
};

const getAB = (str, str2) => {
    const valA = getA(str, str2);
    const valB = length(str) - extraChar(str, str2) - valA;

    return [valA, valB];
};

module.exports = {
    length: length,
    shuffle: shuffle,
    extraChar: extraChar,
    reveal: reveal,
    getAB: getAB,
};
