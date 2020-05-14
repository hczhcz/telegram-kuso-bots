'use strict';

const fs = require('fs');
const fuzzball = require('fuzzball');
const readline = require('readline');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.talkToken);

const fd = fs.openSync('log_talk', 'a');

const log = (head, body) => {
    fs.write(fd, '[' + Date() + '] ' + head + ' ' + body + '\n', () => {
        // nothing
    });
};

let corpus1 = [];
let corpus2 = [];

const updateCorpus = () => {
    const newCorpus1 = [];
    const newCorpus2 = [];

    let last = {};

    readline.createInterface({
        input: fs.createReadStream(config.talkPathCorpus),
    }).on('line', (line) => {
        const obj = JSON.parse(line);

        if (config.talkDataSource[obj.chat]) {
            if (obj.reply_id) {
                last = {};

                if (obj.reply_text) {
                    last.text = obj.reply_text;
                }

                if (obj.reply_sticker) {
                    last.sticker = obj.reply_sticker;
                }
            }

            const payload = {};

            if (obj.text) {
                payload.text = obj.text;
            }

            if (obj.sticker) {
                payload.sticker = obj.sticker;
            }

            newCorpus1.push([payload]);

            if (last.text || last.sticker) {
                newCorpus2.push([last, payload]);
            }

            last = payload;
        }
    }).on('close', () => {
        corpus1 = newCorpus1;
        corpus2 = newCorpus2;
    });
};

const getCandidates = (last) => {
    const candidates = [];

    if (last.text) {
        for (const i in corpus1) {
            if (corpus1[i].text) {
                const rate = fuzzball.ratio(last.text, corpus1[i].text) / 100;

                if (rate > 0.5) {
                    candidates.push([rate * rate * 0.5, corpus1[i]]);
                }
            }
        }

        for (const i in corpus2) {
            if (corpus2[i][0].text) {
                const rate = fuzzball.ratio(last.text, corpus2[i][0].text) / 100;

                if (rate > 0.5) {
                    if (
                        corpus2[i][1].text
                        && corpus2[i][1].text.length <= Math.max(16, last.text.length * 2)
                    ) {
                        candidates.push([rate * rate, corpus2[i][1]]);
                    }

                    if (corpus2[i][1].sticker) {
                        candidates.push([rate * rate, corpus2[i][1]]);
                    }
                }
            }
        }
    }

    if (last.sticker) {
        for (const i in corpus2) {
            if (corpus2[i][0].sticker && last.sticker === corpus2[i][0].sticker) {
                if (corpus2[i][1].text && corpus2[i][1].text.length <= 16) {
                    candidates.push([0.25, corpus2[i][1]]);
                }

                if (corpus2[i][1].sticker) {
                    candidates.push([1, corpus2[i][1]]);
                }
            }
        }
    }

    return candidates;
};

const chooseCandidate = (candidates, force) => {
    let total = 0;

    for (const i in candidates) {
        total += candidates[i][0];
    }

    if (force || total >= 1) {
        let target = Math.random() * total;

        for (const i in candidates) {
            target -= candidates[i][0];

            if (target <= 0) {
                return candidates[i][1];
            }
        }
    }

    return null;
};

bot.on('message', (msg) => {
    if (!msg.text && !msg.sticker || config.ban[msg.from.id]) {
        return;
    }

    const force = msg.chat.id === msg.from.id
        || msg.reply_to_message && msg.reply_to_message.from.username === config.talkUsername;

    if (force || Math.random() < config.talkRate) {
        const last = {};

        if (msg.text) {
            last.text = msg.text;
        }

        if (msg.sticker) {
            last.sticker = msg.sticker.file_id;
        }

        const candidates = getCandidates(last);
        const payload = chooseCandidate(candidates, force);

        if (payload !== null) {
            log(
                msg.chat.id + ':' + msg.from.id + '@' + (msg.from.username || ''),
                (last.text || last.sticker) + ':' + (payload.text || payload.sticker)
            );

            if (payload.text) {
                bot.sendMessage(
                    msg.chat.id,
                    payload.text,
                    {
                        reply_to_message_id: msg.message_id,
                        disable_notification: true,
                    }
                );
            }

            if (payload.sticker) {
                bot.sendSticker(
                    msg.chat.id,
                    payload.sticker,
                    {
                        reply_to_message_id: msg.message_id,
                        disable_notification: true,
                    }
                );
            }
        }
    }
});

updateCorpus();

setInterval(updateCorpus, config.talkUpdateInterval);
