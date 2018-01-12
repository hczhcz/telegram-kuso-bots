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

const getA = (str, test) => {
    let result = 0;

    for (const i in test) {
        if (test[i] === str[i]) {
            result += 1;
        }
    }

    return result;
};

const getAnB = (str, test) => {
    let result = 0;

    const set1 = {};
    const set2 = {};

    for (const i in test) {
        set1['#' + test[i]] = (set1['#' + test[i]] || 0) + 1;
        set2['#' + str[i]] = (set2['#' + str[i]] || 0) + 1;
    }

    for (const i in set1) {
        if (i in set2) {
            result += Math.min(set1[i], set2[i]);
        }
    }

    return result;
};

module.exports = {
    shuffle: shuffle,
    getA: getA,
    getAnB: getAnB,
};
