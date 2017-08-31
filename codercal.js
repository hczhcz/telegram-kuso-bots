'use strict';

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.coderCalToken);

const data = require('./codercal.data')(config.coderCalPathCals);

const core = require('./codercal.core');

process.on('uncaughtException', (err) => {
    console.error(err);
});

const handleAction = (msg, match) => {
    // TODO
};

// /calender <cal id> <title>
bot.onText(/^\/(calender|c) (\w+cal) ([^@\r\n]+)/, handleAction);
// /delete calender <cal id>
bot.onText(/^\/(delete calender|dc) (\w+cal)/, handleAction);

// /dictionary <cal id> <comp id> <random>
// /dictionary <cal id> <comp id> x<pick>
bot.onText(/^\/(dictionary|d) (\w+cal) (\w+) (x?)(\d+)/, handleAction);

// /item <cal id> <comp id> <text>
bot.onText(/^\/(item|i) (\w+cal) (\w+) ([^@\r\n]+)/, handleAction);
// /delete item <cal id> <comp id> <text>
bot.onText(/^\/(delete item|di) (\w+cal) (\w+) ([^@\r\n]+)/, handleAction);

// /activity <cal id> <name>@<good>@<bad>
// /activity <cal id> <name>@<good>@<bad>@weekday
// /activity <cal id> <name>@<good>@<bad>@weekend
bot.onText(/^\/(activity|a) (\w+cal) ([^@\r\n]+)@([^@\r\n]*)@([^@\r\n]*)(@weekday|@weekend)?/, handleAction);
// /delete activity <cal id> <name>
bot.onText(/^\/(delete activity|da) (\w+cal) ([^@\r\n]+)/, handleAction);

// /special <cal id> <name>@good@<good>@<date>
// /special <cal id> <name>@bad@<bad>@<date>
bot.onText(/^\/(special|s) (\w+cal) ([^@\r\n]+)@(good|bad)@([^@\r\n]*)@(\d+)/, handleAction);
// /delete special <cal id> <name>
bot.onText(/^\/(delete special|ds) (\w+cal) ([^@\r\n]+)/, handleAction);

// /hint <cal id> <text>
bot.onText(/^\/(hint|h) (\w+cal) ([^@\r\n]+)/, handleAction);
// /delete hint <cal id> <text>
bot.onText(/^\/(delete hint|dh) (\w+cal) ([^@\r\n]+)/, handleAction);

// /luck <luck id> <title>@<random>
bot.onText(/^\/(luck|l) (\w+luck) ([^@\r\n]+)@(\d+)/, handleAction);
// /delete luck <luck id>
bot.onText(/^\/(delete luck|dl) (\w+luck)/, handleAction);

// /rate <luck id> <name>@<rate>@<descrpiton>
bot.onText(/^\/(rate|r) (\w+luck) ([^@\r\n]+)@(\d+)@([^@\r\n]*)/, handleAction);
// /delete rate <luck id> <name>
bot.onText(/^\/(delete rate|dr) (\w+luck) ([^@\r\n]+)/, handleAction);

bot.on('inline_query', (query) => {
    if (config.ban[query.from.id]) {
        return bot.answerInlineQuery(query.id, [{
            type: 'article',
            id: 'banned',
            title: data.calenders[0].name + (data.suffix[core.getTodayInt() % 10000] || ''),
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
        if (data.calenders[i].name && data.calenders[i].name.match(query.query)) {
            const pickedEvents = core.pickEvents(
                data.calenders[i].dictionaries,
                data.calenders[i].activities,
                data.calenders[i].specials
            );

            let calText = data.calenders[i].name + '\n' + core.getTodayString() + '\n\n宜：';

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
                title: data.calenders[i].name + (data.suffix[core.getTodayInt() % 10000] || ''),
                input_message_content: {
                    message_text: calText,
                },
            });
        }
    }

    if (query.query) {
        for (const i in data.lucks) {
            if (data.lucks[i].name) {
                const pickedLuck = core.pickLuck(data.lucks[i].rates, data.lucks[i].random, query);

                let luckText = data.lucks[i].name + '\n' + core.getTodayString()
                    + '\n\n所求事项：' + query.query
                    + '\n结果：' + pickedLuck.name;

                if (pickedLuck.description) {
                    luckText += ' - ' + pickedLuck.description;
                }

                answers.push({
                    type: 'article',
                    id: data.lucks[i].id,
                    title: data.lucks[i].name + (data.suffix[core.getTodayInt() % 10000] || ''),
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
