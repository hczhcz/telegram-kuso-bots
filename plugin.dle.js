'use strict';

const crypto = require('crypto');
const pinyin = require('pinyin');

const makePinyin = (text) => {
    const tokens = pinyin(text, {
        style: pinyin.STYLE_TONE2,
    });
    const result = [];

    let j = 0;

    for (const i in tokens) {
        const match = (/^([bcdfghjklmnpqrstwxyz]|[csz]h|)([aeginouv]+)(\d?)$/).exec(tokens[i][0]);

        if (match) {
            result.push([text[j], match[1], match[2], match[3]]);
            j += 1;
        } else {
            j += tokens[i][0].length;
        }
    }

    return result;
};

module.exports = (bot, event, playerEvent, env) => {
    bot.onText(/^\/(\d+)dle(@\w+)? ([\u4e00-\u9fff]+)$/, event((msg, match) => {
        msg.chat.mapped = 0;

        const length = parseInt(match[1], 10);
        const guessPinyin = makePinyin(match[3]);

        if (guessPinyin.length === length) {
            const fetched = env.command.fetchCommand(msg, match[1]);
            let targetHash = '';
            let targetPinyin = null;

            for (const i in fetched) {
                const command = fetched[i];

                if (command.text) {
                    const md5sum = crypto.createHash('md5');

                    md5sum.update(command.text + msg.from.id + Math.floor(Date.now() / 86400000));

                    const hash = md5sum.digest('hex');

                    if (targetHash < hash) {
                        const currentPinyin = makePinyin(command.text);

                        if (currentPinyin.length === length) {
                            targetHash = hash;
                            targetPinyin = currentPinyin;
                        }
                    }
                }
            }

            for (let i = 0; i < 4; i += 1) {
                const guessCounts = {};
                const targetCounts = {};
                const pos = [];

                for (let j = 0; j < length; j += 1) {
                    if (guessPinyin[j][i]) {
                        if (guessPinyin[j][i] === targetPinyin[j][i]) {
                            pos.push(0);
                        } else {
                            guessCounts[guessPinyin[j][i]] = (guessCounts[guessPinyin[j][i]] || 0) + 1;
                            targetCounts[targetPinyin[j][i]] = (targetCounts[targetPinyin[j][i]] || 0) + 1;
                            pos.push(guessCounts[guessPinyin[j][i]]);
                        }
                    } else {
                        pos.push(-1);
                    }
                }

                for (let j = 0; j < length; j += 1) {
                    if (guessPinyin[j][i]) {
                        if (pos[j]) {
                            if (pos[j] <= (targetCounts[guessPinyin[j][i]] || 0)) {
                                guessPinyin[j][i] = '<i>' + guessPinyin[j][i] + '</i>';
                            } else {
                                guessPinyin[j][i] = '<del>' + guessPinyin[j][i] + '</del>';
                            }
                        } else {
                            guessPinyin[j][i] = '<b>' + guessPinyin[j][i] + '</b>';
                        }
                    }
                }
            }

            let text = '';

            for (let i = 0; i < length; i += 1) {
                if (i) {
                    text += ' ';
                }

                text += guessPinyin[i][0] + ' ' + guessPinyin[i][1] + guessPinyin[i][2] + guessPinyin[i][3];
            }

            bot.sendMessage(
                msg.chat.id,
                text,
                {
                    parse_mode: 'HTML',
                    reply_to_message_id: msg.message_id,
                }
            );
        } else {
            bot.sendMessage(
                msg.chat.id,
                '长度不对哟',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        }
    }, 2));

    // env.info.addPluginHelp(
    //     '123',
    //     '123<...>人 触发木头人事件\n'
    //         + '123不许<...> 触发不许动事件'
    // );
};
