'use strict';

const dictInit = () => {
    return {
        list: [],
        words: {},
    };
};

const dictAdd = (dict, word, enabled) => {
    if (enabled) {
        dict.list.push(word);
    }

    dict.words['#' + word] = true;
};

const dictSelect = (dict) => {
    return dict.list[Math.floor(Math.random() * dict.list.length)];
};

const guess = (dict, word, answer) => {
    if (dict.words['#' + word]) {
        const guessCounts = [];
        const answerCounts = [];
        const pos = [];

        for (let i = 0; i < answer.length; i += 1) {
            if (word[i] === answer[i]) {
                pos[i] = 0;
            } else {
                guessCounts[word[i].charCodeAt(0)] = (guessCounts[word[i].charCodeAt(0)] || 0) + 1;
                answerCounts[answer[i].charCodeAt(0)] = (answerCounts[answer[i].charCodeAt(0)] || 0) + 1;
                pos[i] = guessCounts[word[i].charCodeAt(0)];
            }
        }

        let tag = 0;

        for (let i = 0; i < answer.length; i += 1) {
            tag *= 10;

            if (pos[i]) {
                if (pos[i] <= (answerCounts[word[i].charCodeAt(0)] || 0)) {
                    tag += 1;
                }
            } else {
                tag += 2;
            }
        }

        return tag;
    }

    return -1;
};

module.exports = {
    dictInit: dictInit,
    dictAdd: dictAdd,
    dictSelect: dictSelect,
    guess: guess,
};
