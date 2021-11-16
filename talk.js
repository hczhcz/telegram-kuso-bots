'use strict';

const fs = require('fs');
const fuzzball = require('fuzzball');
const readline = require('readline');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.talkToken);

const fd = fs.openSync('log_talk', 'a');
const fdAltCorpus = fs.openSync(config.talkPathAltCorpus, 'a');

const log = (head, body) => {
    fs.write(fd, '[' + Date() + '] ' + head + ' ' + body + '\n', () => {
        // nothing
    });
};

const coolDown = {};
let corpus = {};

const updateCorpus = () => {
    const newCorpus = {};
    const last = {};

    readline.createInterface({
        input: fs.createReadStream(config.talkPathCorpus),
    }).on('line', (line) => {
        const obj = JSON.parse(line);
        const tag = config.talkDataSource[obj.chat] || 'public';

        let reply = last[obj.chat] || {};

        if (obj.reply_id) {
            reply = {};

            if (obj.reply_text) {
                reply.text = obj.reply_text;
            }

            if (obj.reply_sticker) {
                reply.sticker = obj.reply_sticker;
            }
        }

        const payload = {};

        if (obj.text) {
            payload.text = obj.text;

            if (
                payload.text.length > 20
                || tag === 'public' && payload.text.length > 10
                || payload.text === reply.text
                || payload.text.match(/@\w+|\/\w+|:\/\//)
            ) {
                last[obj.chat] = payload;

                return;
            }
        }

        if (obj.sticker) {
            payload.sticker = obj.sticker;
        }

        if (reply.text || reply.sticker) {
            newCorpus[tag] = newCorpus[tag] || [];
            newCorpus[tag].push([reply, payload]);

            if (newCorpus[tag].length === 200000) {
                newCorpus[tag] = newCorpus[tag].filter(() => {
                    return Math.random() < 0.5;
                });
            }
        }

        last[obj.chat] = payload;
    }).on('close', () => {
        corpus = newCorpus;
    });
};

const getCandidates = (reply, tag) => {
    const candidates = [];

    if (reply.text) {
        for (const i in corpus[tag]) {
            const payloads = corpus[tag][i];

            if (payloads[0].text) {
                const rate = fuzzball.ratio(reply.text, payloads[0].text) / 100;

                if (rate > 0.5) {
                    if (payloads[1].text && payloads[1].text.length <= reply.text.length) {
                        candidates.push([rate * rate, payloads[1]]);
                    }

                    if (payloads[1].sticker) {
                        candidates.push([rate * rate, payloads[1]]);
                    }
                }
            }
        }
    }

    if (reply.sticker) {
        for (const i in corpus[tag]) {
            const payloads = corpus[tag][i];

            if (payloads[0].sticker && reply.sticker === payloads[0].sticker) {
                if (payloads[1].text) {
                    candidates.push([0.25, payloads[1]]);
                }

                if (payloads[1].sticker) {
                    candidates.push([1, payloads[1]]);
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

    if (force || total > 1) {
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

    // write to alt corpus (not in use for now)

    const obj = {
        id: msg.message_id,
        from: msg.from.id,
        chat: msg.chat.id,
    };

    if (msg.text) {
        obj.text = msg.text;
    }

    if (msg.sticker) {
        obj.sticker = msg.sticker.file_id;
    }

    if (msg.reply_to_message) {
        obj.reply_id = msg.reply_to_message.message_id;

        if (msg.reply_to_message.text) {
            obj.reply_text = msg.reply_to_message.text;
        }

        if (msg.reply_to_message.sticker) {
            obj.reply_sticker = msg.reply_to_message.sticker.file_id;
        }
    }

    fs.write(fdAltCorpus, JSON.stringify(obj) + '\n', () => {
        // nothing
    });

    // talk

    const now = Date.now();

    if (coolDown[msg.chat.id] > now - config.talkCoolDown) {
        return;
    }

    coolDown[msg.chat.id] = now;

    const force = msg.chat.id === msg.from.id
        || msg.reply_to_message && msg.reply_to_message.from.username === config.talkUsername
        || msg.text && config.talkTrigger.exec(msg.text);

    if (force || Math.random() < config.talkRate) {
        const reply = {};

        if (msg.text) {
            reply.text = msg.text;
        }

        if (msg.sticker) {
            reply.sticker = msg.sticker.file_id;
        }

        const tag = config.talkDataSource[msg.chat.id] || 'public';
        const candidates = getCandidates(reply, tag);
        const payload = chooseCandidate(candidates, force);

        if (payload !== null) {
            log(
                msg.chat.id + '@' + (msg.chat.username || '')
                    + ':' + msg.from.id + '@' + (msg.from.username || ''),
                (reply.text || reply.sticker) + ':' + (payload.text || payload.sticker)
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
