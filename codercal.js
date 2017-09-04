'use strict';

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.coderCalToken);

const data = require('./codercal.data')(config.coderCalPathCals);

const core = require('./codercal.core');

process.on('uncaughtException', (err) => {
    console.error(err);
});

const event = (handler) => {
    return (msg, match) => {
        console.log('[' + Date() + '] ' + msg.chat.id + ':' + msg.from.id + '@' + (msg.from.username || '') + ' ' + match[0]);

        // notice: take care of the inline query event
        if (!config.ban[msg.from.id]) {
            handler(msg, match);
        }
    };
};

const limitNum = (num, min, max) => {
    return Math.min(Math.max(num | 0, min), max);
};

// /calender <cal id> <title>
bot.onText(/^\/(calender|c) (\w+cal) ([^@\r\n]+)$/, event((msg, match) => {
    data.writeCalAction('Calender', msg, [match[2], match[3]]);
}));
// /delete calender <cal id>
bot.onText(/^\/(delete calender|dc) (\w+cal)$/, event((msg, match) => {
    data.writeCalAction('DeleteCalender', msg, [match[2]]);
}));

// /dictionary <cal id> <dict id> <random>
// /dictionary <cal id> <dict id> x<pick>
bot.onText(/^\/(dictionary|d) (\w+cal) (\w+) (x)?(\d+)$/, event((msg, match) => {
    if (match[4] === 'x') {
        data.writeCalAction('DictionaryPick', msg, [match[2], match[3], limitNum(match[4], 1, 5)]);
    } else {
        data.writeCalAction('DictionaryRandom', msg, [match[2], match[3], limitNum(match[4], 1, 100)]);
    }
}));

// /item <cal id> <dict id> <item>
bot.onText(/^\/(item|i) (\w+cal) (\w+) ([^@\r\n]+)$/, event((msg, match) => {
    data.writeCalAction('Item', msg, [match[2], match[3], match[4]]);
}));
// /delete item <cal id> <dict id> <item>
bot.onText(/^\/(delete item|di) (\w+cal) (\w+) ([^@\r\n]+)$/, event((msg, match) => {
    data.writeCalAction('DeleteItem', msg, [match[2], match[3], match[4]]);
}));

// /activity <cal id> <name>@<good>@<bad>
// /activity <cal id> <name>@<good>@<bad>@weekday
// /activity <cal id> <name>@<good>@<bad>@weekend
bot.onText(/^\/(activity|a) (\w+cal) ([^@\r\n]+)@([^@\r\n]*)@([^@\r\n]*)(@weekday|@weekend)?$/, event((msg, match) => {
    if (match[6] === '@weekday') {
        data.writeCalAction('ActivityWeekday', msg, [match[2], match[3], match[4], match[5]]);
    } else if (match[6] === '@weekend') {
        data.writeCalAction('ActivityWeekend', msg, [match[2], match[3], match[4], match[5]]);
    } else {
        data.writeCalAction('Activity', msg, [match[2], match[3], match[4], match[5]]);
    }
}));
// /delete activity <cal id> <name>
bot.onText(/^\/(delete activity|da) (\w+cal) ([^@\r\n]+)$/, event((msg, match) => {
    data.writeCalAction('DeleteActivity', msg, [match[2], match[3]]);
}));

// /special <cal id> <name>@good@<good>@<month>/<day>
// /special <cal id> <name>@bad@<bad>@<month>/<day>
bot.onText(/^\/(special|s) (\w+cal) ([^@\r\n]+)@(good|bad)@([^@\r\n]*)@(\d+)\/(\d+)$/, event((msg, match) => {
    if (match[4] === 'good') {
        data.writeCalAction('SpecialGood', msg, [match[2], match[3], match[5], limitNum(match[6], 1, 12) * 100 + limitNum(match[7], 1, 31)]);
    } else if (match[4] === 'bad') {
        data.writeCalAction('SpecialBad', msg, [match[2], match[3], match[5], limitNum(match[6], 1, 12) * 100 + limitNum(match[7], 1, 31)]);
    } else {
        // never reach
        throw Error();
    }
}));
// /delete special <cal id> <name>
bot.onText(/^\/(delete special|ds) (\w+cal) ([^@\r\n]+)$/, event((msg, match) => {
    data.writeCalAction('DeleteSpecial', msg, [match[2], match[3]]);
}));

// /hint <cal id> <hint>
bot.onText(/^\/(hint|h) (\w+cal) ([^@\r\n]+)$/, event((msg, match) => {
    data.writeCalAction('Hint', msg, [match[2], match[3]]);
}));
// /delete hint <cal id> <hint>
bot.onText(/^\/(delete hint|dh) (\w+cal) ([^@\r\n]+)$/, event((msg, match) => {
    data.writeCalAction('DeleteHint', msg, [match[2], match[3]]);
}));

// /luck <luck id> <title>@<random>
bot.onText(/^\/(luck|l) (\w+luck) ([^@\r\n]+)@(\d+)$/, event((msg, match) => {
    data.writeCalAction('Luck', msg, [match[2], match[3], limitNum(match[4], 1, 100)]);
}));
// /delete luck <luck id>
bot.onText(/^\/(delete luck|dl) (\w+luck)$/, event((msg, match) => {
    data.writeCalAction('DeleteLuck', msg, [match[2]]);
}));

// /rate <luck id> <name>@<rate>@<descrpiton>
bot.onText(/^\/(rate|r) (\w+luck) ([^@\r\n]+)@(\d+)@([^@\r\n]*)$/, event((msg, match) => {
    data.writeCalAction('Rate', msg, [match[2], match[3], limitNum(match[4], 1, 10000), match[5]]);
}));
// /delete rate <luck id> <name>
bot.onText(/^\/(delete rate|dr) (\w+luck) ([^@\r\n]+)$/, event((msg, match) => {
    data.writeCalAction('DeleteRate', msg, [match[2], match[3]]);
}));

bot.on('inline_query', (query) => {
    if (config.ban[query.from.id]) {
        return bot.answerInlineQuery(query.id, [{
            type: 'article',
            id: 'banned',
            title: data.calenders[0].title + (data.suffix[core.getTodayInt() % 10000] || ''),
            input_message_content: {
                message_text: '该用户因存在恶意使用 Bot 的报告，已被列入黑名单',
            },
        }], {
            cache_time: 0,
            is_personal: true,
        });
    }

    const answers = [];

    for (const i in data.calenders) {
        if (data.calenders[i].title && data.calenders[i].title.match(query.query)) {
            const pickedEvents = core.pickEvents(
                data.calenders[i].dictionaries,
                data.calenders[i].activities,
                data.calenders[i].specials
            );

            let calText = data.calenders[i].title + '\n' + core.getTodayString() + '\n\n宜：';

            for (const j in pickedEvents.good) {
                calText += '\n' + pickedEvents.good[j].name;

                if (pickedEvents.good[j].description) {
                    calText += ' - ' + pickedEvents.good[j].description;
                }
            }

            calText += '\n\n不宜：';

            for (const j in pickedEvents.bad) {
                calText += '\n' + pickedEvents.bad[j].name;

                if (pickedEvents.bad[j].description) {
                    calText += ' - ' + pickedEvents.bad[j].description;
                }
            }

            calText += '\n\n' + core.pickHints(
                data.calenders[i].dictionaries,
                data.calenders[i].hints
            ).join('\n');

            answers.push({
                type: 'article',
                id: data.calenders[i].id,
                title: data.calenders[i].title + (data.suffix[core.getTodayInt() % 10000] || ''),
                input_message_content: {
                    message_text: calText,
                },
            });
        }
    }

    if (query.query) {
        for (const i in data.lucks) {
            if (data.lucks[i].title) {
                const pickedLuck = core.pickLuck(data.lucks[i].rates, data.lucks[i].random, query);

                let luckText = data.lucks[i].title + '\n' + core.getTodayString()
                    + '\n\n所求事项：' + query.query
                    + '\n结果：' + pickedLuck.name;

                if (pickedLuck.description) {
                    luckText += ' - ' + pickedLuck.description;
                }

                answers.push({
                    type: 'article',
                    id: data.lucks[i].id,
                    title: data.lucks[i].title + (data.suffix[core.getTodayInt() % 10000] || ''),
                    input_message_content: {
                        message_text: luckText,
                    },
                });
            }
        }
    }

    return bot.answerInlineQuery(query.id, answers, {
        cache_time: 0,
        is_personal: true,
    });
});

bot.on('chosen_inline_result', (chosen) => {
    console.log('[' + Date() + '] ' + chosen.from.id + '@' + (chosen.from.username || '') + ' ' + chosen.result_id + ' ' + chosen.query);
});
