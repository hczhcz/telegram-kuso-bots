'use strict';

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.coderCalToken);

const data = require('./codercal.data')(config.coderCalPathCals);

const core = require('./codercal.core');

process.on('uncaughtException', (err) => {
    console.error(err);
});

bot.on('inline_query', (query) => {
    if (config.ban[query.from.id]) {
        return bot.answerInlineQuery(query.id, [{
            type: 'article',
            id: 'BANNED',
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
        if (data.calenders[i].name !== 'off' && data.calenders[i].name.match(query.query)) {
            const pickedEvents = core.pickEvents(
                data.calenders[i].components,
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
                data.calenders[i].components,
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
            if (data.lucks[i].name !== 'off') {
                const pickedLuck = core.pickLuck(data.lucks[i].list, data.lucks[i].random, query);

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
    console.log('[' + Date() + '] ' + chosen.from.id + '@' + (chosen.from.username || '') + ' ' + chosen.query + ' ' + chosen.result_id);
});
