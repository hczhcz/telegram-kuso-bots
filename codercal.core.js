'use strict';

const crc32 = require('crc-32');

const getCST = () => {
    return new Date(Date.now() + 8 * 3600 * 1000);
};

const isWeekend = () => {
    const today = getCST();

    return today.getUTCDay() === 0 || today.getUTCDay() === 6;
};

const isSomeday = () => {
    const today = getCST();

    return today.getUTCMonth() === 5 && today.getUTCDate() === 4;
};

const getTodayInt = () => {
    const today = getCST();

    return today.getUTCFullYear() * 10000
        + (today.getUTCMonth() + 1) * 100
        + today.getUTCDate();
};

const getTodayString = () => {
    const today = getCST();

    return '今天是' + today.getUTCFullYear() + '年'
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

const pickComponent = (components, name) => {
    for (const i in components) {
        if (components[i].name === name) {
            if (components[i].random) {
                return components[i].list[
                    random(components[i].random) % components[i].list.length
                ];
            } else if (components[i].pick) {
                return pickRandom(components[i].list, components[i].pick).join('，');
            } else {
                // never reach
                throw Error();
            }
        }
    }

    // notice: allow empty component
    return '';
};

const pickActivities = (activities, size) => {
    if (isWeekend()) {
        const todayActivities = [];

        for (const i in activities) {
            if (activities[i].weekend) {
                todayActivities.push(activities[i]);
            }
        }

        return pickRandom(todayActivities, size);
    } else {
        return pickRandom(activities, size);
    }
};

const pickSpecials = (specials) => {
    const todaySpecials = [];

    const date = getTodayInt() % 10000; // month and day

    for (const i in specials) {
        if (specials[i].date === date) {
            todaySpecials.push(specials[i]);
        }
    }

    return todaySpecials;
};

const parse = (components, text) => {
    const sections = text.split('%');

    let result = '';

    for (const i in sections) {
        if (i % 2) {
            result += pickComponent(components, sections[i]);
        } else {
            result += sections[i];
        }
    }

    return result;
};

const pickEvents = (components, activities, specials) => {
    const good = [];
    const bad = [];

    const numGood = random(98) % 3 + 2;
    const numBad = random(87) % 3 + 2;

    const pickedActivities = pickActivities(activities, numGood + numBad);

    for (const i in pickedActivities) {
        if (i < numGood) {
            good.push({
                name: parse(components, pickedActivities[i].name),
                description: parse(components, pickedActivities[i].good),
            });
        } else {
            bad.push({
                name: parse(components, pickedActivities[i].name),
                description: parse(components, pickedActivities[i].bad),
            });
        }
    }

    const pickedSpecials = pickSpecials(specials);

    for (const i in pickedSpecials) {
        if (pickedSpecials[i].good) {
            good.push({
                name: parse(components, pickedSpecials[i].name),
                description: parse(components, pickedSpecials[i].good),
            });
        } else {
            bad.push({
                name: parse(components, pickedSpecials[i].name),
                description: parse(components, pickedSpecials[i].bad),
            });
        }
    }

    return {
        good: good,
        bad: bad,
    };
};

const pickHints = (components, hints) => {
    const todayHints = [];

    for (const i in hints) {
        todayHints.push(parse(components, hints[i]));
    }

    return todayHints;
};

const pickLuck = (list, iter, query) => {
    let range = 0;

    for (const i in list) {
        range += list[i].rate;
    }

    const target = seedRandom(
        crc32.str(query.query) ^ query.from.id, iter
    ) % range;
    let sum = 0;

    for (const i in list) {
        sum += list[i].rate;

        if (sum > target) {
            return list[i];
        }
    }

    // never reach
    throw Error();
};

module.exports = {
    isSomeday: isSomeday,
    getTodayString: getTodayString,
    pickEvents: pickEvents,
    pickHints: pickHints,
    pickLuck: pickLuck,
};
