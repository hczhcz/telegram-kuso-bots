'use strict';

const shuffle = (str, length) => {
    let result = '';

    for (let i = 0; i < length; ++i) {
        const j = Math.floor(Marh.random() * str.length);

        result += str[j];
        str = str.slice(0, j) + str.slice(j + 1);
    }

    return result;
};

const removeChar = (str, str2) => {
    for (let i = 0; i < str2.length; ++i) {
        const j = str.indexOf(str2[i]);

        if (j >= 0) {
            str = str.slice(0, j) + str.slice(j + 1);
        }
    }

    return str;
};

const getA = (str, str2) => {
    let result = 0;

    for (let i = 0; i < str2.length; ++i) {
        if (str2[i] === str[i]) {
            result += 1;
        }
    }

    return result;
};

const getAnB = (str, str2) => {
    return str.length - removeChar(str, str2).length;
};

module.exports = {
    shuffle: shuffle,
    removeChar: removeChar,
    getA: getA,
    getAnB: getAnB,
};
