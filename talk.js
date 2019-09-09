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

            const current = {};

            if (obj.text) {
                current.text = obj.text;
            }

            if (obj.sticker) {
                current.sticker = obj.sticker;
            }

            newCorpus1.push([current]);

            if (last.text || last.sticker) {
                newCorpus2.push([last, current]);
            }

            last = current;
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
                const rate = 0.01 * fuzzball.ratio(last.text, corpus1[i].text);

                if (rate > 0.5) {
                    candidates.push([0.5 * rate * rate, corpus1[i]]);
                }
            }
        }

        for (const i in corpus2) {
            if (corpus2[i][0].text) {
                const rate = 0.01 * fuzzball.ratio(last.text, corpus2[i][0].text);

                if (rate > 0.5) {
                    candidates.push([rate * rate, corpus2[i][1]]);
                }
            }
        }
    }

    if (last.sticker) {
        for (const i in corpus2) {
            if (corpus2[i][0].sticker && last.sticker === corpus2[i][0].sticker) {
                if (corpus2[i][1].sticker) {
                    candidates.push([1, corpus2[i][1]]);
                } else {
                    candidates.push([0.25, corpus2[i][1]]);
                }
            }
        }
    }

    return candidates;
};

const chooseCandidate = (last) => {
    const candidates = getCandidates(last);

    let total = 0;

    for (const i in candidates) {
        total += candidates[i][0];
    }

    if (total >= 1) {
        let target = total * Math.random();

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
    if (!msg.text && !msg.sticker) {
        return;
    }

    const force = msg.reply_to_message && msg.reply_to_message.from.id === config.talkUsername;

    if (force || Math.random() < config.talkRate) {
        const last = {};

        if (msg.text) {
            last.text = msg.text;
        }

        if (msg.sticker) {
            last.sticker = msg.sticker.file_id;
        }

        const candidate = chooseCandidate(last);

        if (candidate !== null) {
            log(
                msg.chat.id + ':' + msg.from.id + '@' + (msg.from.username || ''),
                (last.text || last.sticker) + ':' + (candidate.text || candidate.sticker)
            );

            if (candidate.text) {
                bot.sendMessage(
                    msg.chat.id,
                    candidate.text,
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            }

            if (candidate.sticker) {
                bot.sendSticker(
                    msg.chat.id,
                    candidate.sticker,
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            }
        }
    }
});

updateCorpus();

setInterval(updateCorpus, config.talkUpdateInterval);
