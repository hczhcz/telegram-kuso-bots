'use strict';

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.coderCalToken);

const data = require('./codercal.data')(config.coderCalPathCals);

const core = require('./codercal.core');

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
    return Math.min(Math.max(parseInt(num, 10), min), max);
};

bot.onText(/^\/help(@\w+)?$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        '命令列表：\n'
            + '/help\n'
            + '/calender <cal id> <title>\n'
            + '/disable calender <cal id>\n'
            + '/dictionary <cal id> <dict id> <random>\n'
            + '/dictionary <cal id> <dict id> x<pick>\n'
            + '/item <cal id> <dict id> <item>\n'
            + '/delete item <cal id> <dict id> <item>\n'
            + '/activity <cal id> <name>@<good>@<bad>\n'
            + '/activity <cal id> <name>@<good>@<bad>@weekday\n'
            + '/activity <cal id> <name>@<good>@<bad>@weekend\n'
            + '/delete activity <cal id> <name>\n'
            + '/special <cal id> <name>@good@<good>@<month>/<day>\n'
            + '/special <cal id> <name>@bad@<bad>@<month>/<day>\n'
            + '/delete special <cal id> <name>\n'
            + '/hint <cal id> <hint>\n'
            + '/delete hint <cal id> <hint>\n'
            + '/luck <luck id> <title>@<random>\n'
            + '/disable luck <luck id>\n'
            + '/rate <luck id> <name>@<weight>@<descrpiton>\n'
            + '/delete rate <luck id> <name>\n'
            + '\n'
            + '备注：\n'
            + '<cal id> 必须以 cal 结尾\n'
            + '<luck id> 必须以 luck 结尾\n'
            + '除 /help 外，命令可以用首字母缩写\n'
            + '例如 /c 等同 /calender\n'
            + '/dc 等同 /disable calender'
    );
}));

// /calender <cal id> <title>
bot.onText(/^\/(calender|c) (\w+cal) ([^@\r\n]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('Calender', msg, [match[2], match[3]])
    );
}));
// /disable calender <cal id>
bot.onText(/^\/(disable calender|dc) (\w+cal)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('DisableCalender', msg, [match[2]])
    );
}));

// /dictionary <cal id> <dict id> <random>
// /dictionary <cal id> <dict id> x<pick>
bot.onText(/^\/(dictionary|d) (\w+cal) (\w+) (x)?(\d+)$/, event((msg, match) => {
    if (match[4] === 'x') {
        bot.sendMessage(
            msg.chat.id,
            data.writeCalAction('DictionaryPick', msg, [match[2], match[3], limitNum(match[4], 1, 5)])
        );
    } else {
        bot.sendMessage(
            msg.chat.id,
            data.writeCalAction('DictionaryRandom', msg, [match[2], match[3], limitNum(match[4], 1, 100)])
        );
    }
}));

// /item <cal id> <dict id> <item>
bot.onText(/^\/(item|i) (\w+cal) (\w+) ([^@\r\n]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('Item', msg, [match[2], match[3], match[4]])
    );
}));
// /delete item <cal id> <dict id> <item>
bot.onText(/^\/(delete item|di) (\w+cal) (\w+) ([^@\r\n]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('DeleteItem', msg, [match[2], match[3], match[4]])
    );
}));

// /activity <cal id> <name>@<good>@<bad>
// /activity <cal id> <name>@<good>@<bad>@weekday
// /activity <cal id> <name>@<good>@<bad>@weekend
bot.onText(/^\/(activity|a) (\w+cal) ([^@\r\n]+)@([^@\r\n]*)@([^@\r\n]*)(@weekday|@weekend)?$/, event((msg, match) => {
    if (match[6] === '@weekday') {
        bot.sendMessage(
            msg.chat.id,
            data.writeCalAction('ActivityWeekday', msg, [match[2], match[3], match[4], match[5]])
        );
    } else if (match[6] === '@weekend') {
        bot.sendMessage(
            msg.chat.id,
            data.writeCalAction('ActivityWeekend', msg, [match[2], match[3], match[4], match[5]])
        );
    } else {
        bot.sendMessage(
            msg.chat.id,
            data.writeCalAction('Activity', msg, [match[2], match[3], match[4], match[5]])
        );
    }
}));
// /delete activity <cal id> <name>
bot.onText(/^\/(delete activity|da) (\w+cal) ([^@\r\n]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('DeleteActivity', msg, [match[2], match[3]])
    );
}));

// /special <cal id> <name>@good@<good>@<month>/<day>
// /special <cal id> <name>@bad@<bad>@<month>/<day>
bot.onText(/^\/(special|s) (\w+cal) ([^@\r\n]+)@(good|bad)@([^@\r\n]*)@(\d+)\/(\d+)$/, event((msg, match) => {
    if (match[4] === 'good') {
        bot.sendMessage(
            msg.chat.id,
            data.writeCalAction('SpecialGood', msg, [match[2], match[3], match[5], limitNum(match[6], 1, 12) * 100 + limitNum(match[7], 1, 31)])
        );
    } else if (match[4] === 'bad') {
        bot.sendMessage(
            msg.chat.id,
            data.writeCalAction('SpecialBad', msg, [match[2], match[3], match[5], limitNum(match[6], 1, 12) * 100 + limitNum(match[7], 1, 31)])
        );
    } else {
        // never reach
        throw Error();
    }
}));
// /delete special <cal id> <name>
bot.onText(/^\/(delete special|ds) (\w+cal) ([^@\r\n]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('DeleteSpecial', msg, [match[2], match[3]])
    );
}));

// /hint <cal id> <hint>
bot.onText(/^\/(hint|h) (\w+cal) ([^@\r\n]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('Hint', msg, [match[2], match[3]])
    );
}));
// /delete hint <cal id> <hint>
bot.onText(/^\/(delete hint|dh) (\w+cal) ([^@\r\n]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('DeleteHint', msg, [match[2], match[3]])
    );
}));

// /luck <luck id> <title>@<random>
bot.onText(/^\/(luck|l) (\w+luck) ([^@\r\n]+)@(\d+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('Luck', msg, [match[2], match[3], limitNum(match[4], 1, 100)])
    );
}));
// /disable luck <luck id>
bot.onText(/^\/(disable luck|dl) (\w+luck)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('DisableLuck', msg, [match[2]])
    );
}));

// /rate <luck id> <name>@<weight>@<descrpiton>
bot.onText(/^\/(rate|r) (\w+luck) ([^@\r\n]+)@(\d+)@([^@\r\n]*)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('Rate', msg, [match[2], match[3], limitNum(match[4], 1, 10000), match[5]])
    );
}));
// /delete rate <luck id> <name>
bot.onText(/^\/(delete rate|dr) (\w+luck) ([^@\r\n]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('DeleteRate', msg, [match[2], match[3]])
    );
}));

bot.on('inline_query', (query) => {
    if (config.ban[query.from.id]) {
        return bot.answerInlineQuery(query.id, [{
            type: 'article',
            id: 'banned',
            title: data.calenders[0].title + (data.suffix[core.getTodayInt() % 10000] || ''),
            input_message_content: {
                message_text: '该用户因存在恶意使用 bot 的报告，已被列入黑名单',
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

data.loadCalActions();
