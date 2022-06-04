'use strict';

const pinyin = require('pinyin');

const makePinyin = (word) => {
    const tokens = pinyin(word, {
        style: pinyin.STYLE_TONE2,
        segment: true,
    });
    const result = [];

    if (tokens.length !== word.length) {
        return null;
    }

    for (const i in word) {
        const match = tokens[i][0].match(/^([bcdfghjklmnpqrstwxyz]|ch|sh|zh|)([aeiouv]+(?:n|ng|)|ng|er)(\d?)$/);

        if (!match) {
            return null;
        }

        if (match[2] === 'ng') {
            match[2] = 'eng';
        }

        result.push([word[i], match[1], match[2], match[3]]);
    }

    return result;
};

const dictInit = () => {
    return {
        language: 'cn',
        list: [],
    };
};

const dictAdd = (dict, word) => {
    dict.list.push(word);
};

const dictSelect = (dict) => {
    return dict.list[Math.floor(Math.random() * dict.list.length)];
};

const guess = (dict, word, answer) => {
    // dict is not used

    const guessPinyin = makePinyin(word);
    const targetPinyin = makePinyin(answer);
    const tag = ['', '', '', ''];

    if (!guessPinyin) {
        return -1;
    }

    tag.pinyin = () => {
        return guessPinyin;
    };

    for (let i = 0; i < 4; i += 1) {
        const guessCounts = {};
        const answerCounts = {};
        const pos = [];

        for (let j = 0; j < answer.length; j += 1) {
            if (guessPinyin[j][i] === targetPinyin[j][i]) {
                pos.push(0);
            } else {
                guessCounts[guessPinyin[j][i]] = (guessCounts[guessPinyin[j][i]] || 0) + 1;
                answerCounts[targetPinyin[j][i]] = (answerCounts[targetPinyin[j][i]] || 0) + 1;
                pos.push(guessCounts[guessPinyin[j][i]]);
            }
        }

        for (let j = 0; j < answer.length; j += 1) {
            if (pos[j]) {
                if (pos[j] <= (answerCounts[guessPinyin[j][i]] || 0)) {
                    tag[i] += '1';
                } else {
                    tag[i] += '0';
                }
            } else {
                tag[i] += '2';
            }
        }
    }

    return tag;
};

module.exports = {
    dictInit: dictInit,
    dictAdd: dictAdd,
    dictSelect: dictSelect,
    guess: guess,
};
