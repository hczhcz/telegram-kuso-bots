'use strict';

const crc32 = require('crc-32');

const getCST = () => {
    return new Date(Date.now() + 8 * 3600 * 1000);
};

const isWeekend = () => {
    const today = getCST();

    return today.getUTCDay() === 0 || today.getUTCDay() === 6;
};

const getTodayInt = () => {
    const today = getCST();

    return today.getUTCFullYear() * 10000
        + (today.getUTCMonth() + 1) * 100
        + today.getUTCDate();
};

const getTodayString = () => {
    const today = getCST();

    return '今天是 ' + today.getUTCFullYear() + '年'
        + (today.getUTCMonth() + 1) + '月'
        + today.getUTCDate() + '日'
        + ' 星期' + '日一二三四五六'[today.getUTCDay()];
};

const seedRandom = (seed, iter) => {
    let result = seed;

    for (let i = 0; i < 100 + iter; i += 1) {
        result *= result;
        result %= 11117;
    }

    return result;
};

const random = (iter) => {
    return seedRandom(getTodayInt() % 11117, iter);
};

const pickRandom = (list, size) => {
    const result = list.slice();

    for (let i = 0; i < list.length - size; i += 1) {
        result.splice(random(i) % result.length, 1);
    }

    return result;
};

const pickDictionary = (dictionaries, id) => {
    for (const i in dictionaries) {
        if (dictionaries[i].id === id) {
            if ('random' in dictionaries[i]) {
                return dictionaries[i].items[
                    random(dictionaries[i].random) % dictionaries[i].items.length
                ];
            } else if ('pick' in dictionaries[i]) {
                return pickRandom(dictionaries[i].items, dictionaries[i].pick).join('，');
            }

            // never reach
            throw Error();
        }
    }

    // notice: allow empty lists
    return '';
};

const pickActivities = (activities, size) => {
    const todayActivities = [];

    for (const i in activities) {
        if (
            isWeekend()
                ? activities[i].weekend
                : activities[i].weekday
        ) {
            todayActivities.push(activities[i]);
        }
    }

    return pickRandom(todayActivities, size);
};

const pickSpecials = (specials) => {
    const todaySpecials = [];

    const date = getTodayInt() % 10000;

    for (const i in specials) {
        if (specials[i].date === date) {
            todaySpecials.push(specials[i]);
        }
    }

    return todaySpecials;
};

const parse = (dictionaries, text) => {
    const sections = text.split('%');

    let result = '';

    for (const i in sections) {
        if (i % 2) {
            result += pickDictionary(dictionaries, sections[i]);
        } else {
            result += sections[i];
        }
    }

    return result;
};

const pickEvents = (dictionaries, activities, specials) => {
    const good = [];
    const bad = [];

    const numGood = random(98) % 3 + 2;
    const numBad = random(87) % 3 + 2;

    const pickedActivities = pickActivities(activities, numGood + numBad);

    for (const i in pickedActivities) {
        if (i < numGood) {
            good.push({
                name: parse(dictionaries, pickedActivities[i].name),
                description: parse(dictionaries, pickedActivities[i].good),
            });
        } else {
            bad.push({
                name: parse(dictionaries, pickedActivities[i].name),
                description: parse(dictionaries, pickedActivities[i].bad),
            });
        }
    }

    const pickedSpecials = pickSpecials(specials);

    for (const i in pickedSpecials) {
        if ('good' in pickedSpecials[i]) {
            good.push({
                name: parse(dictionaries, pickedSpecials[i].name),
                description: parse(dictionaries, pickedSpecials[i].good),
            });
        } else if ('bad' in pickedSpecials[i]) {
            bad.push({
                name: parse(dictionaries, pickedSpecials[i].name),
                description: parse(dictionaries, pickedSpecials[i].bad),
            });
        } else {
            // never reach
            throw Error();
        }
    }

    return {
        good: good,
        bad: bad,
    };
};

const pickHints = (dictionaries, hints) => {
    const todayHints = [];

    for (const i in hints) {
        todayHints.push(parse(dictionaries, hints[i]));
    }

    return todayHints;
};

const pickLuck = (rates, iter, query) => {
    let range = 0;

    for (const i in rates) {
        range += rates[i].weight;
    }

    const target = seedRandom(
        (crc32.str(query.query) ^ query.from.id ^ getTodayInt()) % 23333, iter
    ) % range;
    let sum = 0;

    for (const i in rates) {
        sum += rates[i].weight;

        if (sum > target) {
            return rates[i];
        }
    }

    // happen only if the list is empty
    return {
        name: '什么都没有算出来呢',
        weight: 1,
        description: '',
    };
};

module.exports = {
    getTodayInt: getTodayInt,
    getTodayString: getTodayString,
    pickEvents: pickEvents,
    pickHints: pickHints,
    pickLuck: pickLuck,
};
