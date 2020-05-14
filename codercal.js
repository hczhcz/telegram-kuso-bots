'use strict';

const fs = require('fs');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.coderCalToken);

const data = require('./codercal.data')(config.coderCalPathCals);

const core = require('./codercal.core');

const fd = fs.openSync('log_codercal', 'a');

const log = (head, body) => {
    fs.write(fd, '[' + Date() + '] ' + head + ' ' + body + '\n', () => {
        // nothing
    });
};

const event = (handler, atIndex) => {
    return (msg, match) => {
        if (!match[atIndex] || match[atIndex] === '@' + config.coderCalUsername) {
            log(
                msg.chat.id + ':' + msg.from.id + '@' + (msg.from.username || ''),
                match[0]
            );

            // notice: take care of the inline query event
            if (!config.ban[msg.from.id]) {
                handler(msg, match);
            }
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
}, 1));

// /calender <cal id> <title>
bot.onText(/^\/(calender|c) (\w+cal) ([^\n\r@]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('Calender', msg, [match[2], match[3]])
    );
}, -1));
// /disable calender <cal id>
bot.onText(/^\/(disable calender|dc) (\w+cal)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('DisableCalender', msg, [match[2]])
    );
}, -1));

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
}, -1));

// /item <cal id> <dict id> <item>
bot.onText(/^\/(item|i) (\w+cal) (\w+) ([^\n\r@]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('Item', msg, [match[2], match[3], match[4]])
    );
}, -1));
// /delete item <cal id> <dict id> <item>
bot.onText(/^\/(delete item|di) (\w+cal) (\w+) ([^\n\r@]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('DeleteItem', msg, [match[2], match[3], match[4]])
    );
}, -1));

// /activity <cal id> <name>@<good>@<bad>
// /activity <cal id> <name>@<good>@<bad>@weekday
// /activity <cal id> <name>@<good>@<bad>@weekend
bot.onText(/^\/(activity|a) (\w+cal) ([^\n\r@]+)@([^\n\r@]*)@([^\n\r@]*)(@weekday|@weekend)?$/, event((msg, match) => {
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
}, -1));
// /delete activity <cal id> <name>
bot.onText(/^\/(delete activity|da) (\w+cal) ([^\n\r@]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('DeleteActivity', msg, [match[2], match[3]])
    );
}, -1));

// /special <cal id> <name>@good@<good>@<month>/<day>
// /special <cal id> <name>@bad@<bad>@<month>/<day>
bot.onText(/^\/(special|s) (\w+cal) ([^\n\r@]+)@(good|bad)@([^\n\r@]*)@(\d+)\/(\d+)$/, event((msg, match) => {
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
}, -1));
// /delete special <cal id> <name>
bot.onText(/^\/(delete special|ds) (\w+cal) ([^\n\r@]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('DeleteSpecial', msg, [match[2], match[3]])
    );
}, -1));

// /hint <cal id> <hint>
bot.onText(/^\/(hint|h) (\w+cal) ([^\n\r@]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('Hint', msg, [match[2], match[3]])
    );
}, -1));
// /delete hint <cal id> <hint>
bot.onText(/^\/(delete hint|dh) (\w+cal) ([^\n\r@]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('DeleteHint', msg, [match[2], match[3]])
    );
}, -1));

// /luck <luck id> <title>@<random>
bot.onText(/^\/(luck|l) (\w+luck) ([^\n\r@]+)@(\d+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('Luck', msg, [match[2], match[3], limitNum(match[4], 1, 100)])
    );
}, -1));
// /disable luck <luck id>
bot.onText(/^\/(disable luck|dl) (\w+luck)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('DisableLuck', msg, [match[2]])
    );
}, -1));

// /rate <luck id> <name>@<weight>@<descrpiton>
bot.onText(/^\/(rate|r) (\w+luck) ([^\n\r@]+)@(\d+)@([^\n\r@]*)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('Rate', msg, [match[2], match[3], limitNum(match[4], 1, 10000), match[5]])
    );
}, -1));
// /delete rate <luck id> <name>
bot.onText(/^\/(delete rate|dr) (\w+luck) ([^\n\r@]+)$/, event((msg, match) => {
    bot.sendMessage(
        msg.chat.id,
        data.writeCalAction('DeleteRate', msg, [match[2], match[3]])
    );
}, -1));

bot.on('inline_query', (query) => {
    if (config.ban[query.from.id]) {
        bot.answerInlineQuery(query.id, [{
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
    } else {
        const answers = [];

        const addCalender = (calender) => {
            const pickedEvents = core.pickEvents(
                calender.dictionaries,
                calender.activities,
                calender.specials
            );

            let calText = calender.title + '\n' + core.getTodayString() + '\n\n宜：';

            for (const i in pickedEvents.good) {
                calText += '\n' + pickedEvents.good[i].name;

                if (pickedEvents.good[i].description) {
                    calText += ' - ' + pickedEvents.good[i].description;
                }
            }

            calText += '\n\n不宜：';

            for (const i in pickedEvents.bad) {
                calText += '\n' + pickedEvents.bad[i].name;

                if (pickedEvents.bad[i].description) {
                    calText += ' - ' + pickedEvents.bad[i].description;
                }
            }

            calText += '\n\n' + core.pickHints(
                calender.dictionaries,
                calender.hints
            ).join('\n');

            answers.push({
                type: 'article',
                id: calender.id,
                title: calender.title + (data.suffix[core.getTodayInt() % 10000] || ''),
                input_message_content: {
                    message_text: calText,
                },
            });
        };

        for (const i in data.calenders) {
            if (data.calenders[i].title && data.calenders[i].title.indexOf(query.query) >= 0) {
                addCalender(data.calenders[i]);
            }
        }

        const addLuck = (luck) => {
            const pickedLuck = core.pickLuck(luck.rates, luck.random, query);

            let luckText = luck.title + '\n' + core.getTodayString()
                + '\n\n所求事项：' + query.query
                + '\n结果：' + pickedLuck.name;

            if (pickedLuck.description) {
                luckText += ' - ' + pickedLuck.description;
            }

            answers.push({
                type: 'article',
                id: luck.id,
                title: luck.title + (data.suffix[core.getTodayInt() % 10000] || ''),
                input_message_content: {
                    message_text: luckText,
                },
            });
        };

        if (query.query) {
            for (const i in data.lucks) {
                if (data.lucks[i].title) {
                    addLuck(data.lucks[i]);
                }
            }
        }

        bot.answerInlineQuery(query.id, answers, {
            cache_time: 0,
            is_personal: true,
        });
    }
});

bot.on('chosen_inline_result', (chosen) => {
    log(
        'inline:' + chosen.from.id + '@' + (chosen.from.username || ''),
        chosen.result_id + ' ' + chosen.query
    );
});

data.loadCalActions();
