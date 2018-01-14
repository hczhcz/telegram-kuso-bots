'use strict';

const length = (str) => {
    const arr = Array.from(str);

    return arr.length;
}

const shuffle = (str, length) => {
    const arr = Array.from(str);

    let result = '';

    for (let i = 0; i < length; ++i) {
        const j = Math.floor(Math.random() * arr.length);

        result += arr[j];
        arr[j] = arr[arr.length - 1];
        arr.pop();
    }

    return result;
};

const extraChar = (str, str2) => {
    const arr = Array.from(str);
    const arr2 = Array.from(str2);

    for (let i = 0; i < arr2.length; ++i) {
        const j = arr.indexOf(arr2[i]);

        if (j >= 0) {
            arr[j] = arr[arr.length - 1];
            arr.pop();
        }
    }

    return arr.length;
};

const getA = (str, str2) => {
    const arr = Array.from(str);
    const arr2 = Array.from(str2);

    let result = 0;

    for (let i = 0; i < arr2.length; ++i) {
        if (arr2[i] === arr[i]) {
            result += 1;
        }
    }

    return result;
};

const getAB = (str, str2) => {
    const a = getA(str, str2);

    return [a, length(str) - extraChar(str, str2) - a];
};

module.exports = {
    length: length,
    shuffle: shuffle,
    extraChar: extraChar,
    getAB: getAB,
};
