'use strict';

const fs = require('fs');
const fuzzball = require('fuzzball');
const https = require('https');
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
    let count = 0;
    const newCorpus = {};
    const last = {};

    const rl = readline.createInterface({
        input: fs.createReadStream(config.talkPathCorpus),
    }).on('line', (line) => {
        count += 1;

        // to reduce cpu load
        if (count === config.talkCorpusLimit) {
            rl.pause();

            setTimeout(() => {
                count = 0;
                rl.resume();
            }, 1000);
        }

        const obj = JSON.parse(line);
        const tag = config.talkDataSource[obj.chat];

        if (!tag) {
            return;
        }

        let reply = last[obj.chat] || {};
        let weight = 1;

        if (obj.reply_id) {
            reply = {};
            weight = 5;

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

            if (payload.text.length > 60 || payload.text === reply.text) {
                return;
            }

            if (payload.text.length > 20 || payload.text.match(config.talkIgnore)) {
                last[obj.chat] = payload;

                return;
            }
        }

        if (obj.sticker) {
            payload.sticker = obj.sticker;
        }

        last[obj.chat] = payload;

        if (reply.text && (obj.text || obj.sticker) || reply.sticker && obj.sticker) {
            newCorpus[tag] = newCorpus[tag] || [];
            newCorpus[tag].push([reply, payload, weight]);

            if (newCorpus[tag].length === config.talkCorpusLimit) {
                newCorpus[tag] = newCorpus[tag].filter(() => {
                    return Math.random() < 0.5;
                });

                if (global.gc) {
                    global.gc();
                }
            }
        }
    }).on('close', () => {
        corpus = newCorpus;
        log('ready', '');
    });
};

const getCandidates = (reply, tag) => {
    const candidates = [];

    if (reply.text && reply.text.length <= 120) {
        for (const i in corpus[tag]) {
            const payloads = corpus[tag][i];

            if (payloads[0].text) {
                const rate = fuzzball.ratio(reply.text, payloads[0].text) / 100;

                if (rate >= 0.5) {
                    if (payloads[1].text && payloads[1].text.length <= reply.text.length * 2) {
                        candidates.push([rate * rate * payloads[2], payloads[1]]);
                    }

                    if (payloads[1].sticker) {
                        candidates.push([rate * rate * payloads[2], payloads[1]]);
                    }
                }
            }
        }
    }

    if (reply.sticker) {
        for (const i in corpus[tag]) {
            const payloads = corpus[tag][i];

            if (payloads[0].sticker && reply.sticker === payloads[0].sticker && payloads[1].sticker) {
                candidates.push([payloads[2], payloads[1]]);
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

const chooseCandidateLlm = (reply, candidates, send) => {
    const lines = [];

    for (let i = 0; i < 30 && lines.length < 10; i += 1) {
        const payload = chooseCandidate(candidates, true);

        if (payload.text && lines.indexOf(payload.text) < 0) {
            lines.push(payload.text);
        }
    }

    if (lines.length <= 1) {
        send(null);
    } else {
        let query = 'Q:' + reply.text.replaceAll(':', ' ').replaceAll('\n', ' ') + '\n';

        for (const i in lines) {
            query += i + ':' + lines[i].replaceAll(':', ' ').replaceAll('\n', ' ') + '\n';
        }

        const req = https.request(config.talkLlmUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + config.talkLlmToken,
            },
        }, (res) => {
            const data = [];

            res.on('data', (chunk) => {
                data.push(chunk);
            });

            res.on('end', () => {
                const result = JSON.parse(Buffer.concat(data).toString()).choices[0].message.content;
                const i = parseInt(result, 10);

                log('llm', query.replaceAll('\n', ' ') + ':' + result);

                if (i >= 0 && i < lines.length) {
                    send({
                        text: lines[i],
                    });
                } else {
                    send(null);
                }
            });
        }).on('error', (err) => {
            console.error(err.message);
            send(null);
        });

        req.write(JSON.stringify({
            model: config.talkLlmModel,
            messages: [
                {
                    role: 'system',
                    content: '选出一条对Q的回复',
                },
                {
                    role: 'user',
                    content: query,
                },
                {
                    role: 'assistant',
                    content: 'A=',
                    prefix: true,
                },
            ],
            max_tokens: 3,
        }));
        req.end();
    }
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
        || msg.text && msg.text.match(config.talkTrigger);

    if (force || Math.random() < config.talkRate) {
        const reply = {};

        if (msg.text) {
            reply.text = msg.text;
        }

        if (msg.sticker) {
            reply.sticker = msg.sticker.file_id;
        }

        const tag = config.talkDataTarget[msg.chat.id] || config.talkDataDefaultTarget;
        const candidates = getCandidates(reply, tag);
        const payload = chooseCandidate(candidates, force);

        if (payload !== null) {
            log(
                msg.chat.id + '@' + (msg.chat.username || '')
                    + ':' + msg.from.id + '@' + (msg.from.username || ''),
                (reply.text || reply.sticker) + ':' + (payload.text || payload.sticker)
            );

            if (payload.text) {
                if (reply.text && !config.talkLlmOff[msg.chat.id]) {
                    chooseCandidateLlm(reply, candidates, (payloadLlm) => {
                        bot.sendMessage(
                            msg.chat.id,
                            payloadLlm === null
                                ? payload.text
                                : payloadLlm.text,
                            {
                                reply_to_message_id: msg.message_id,
                                disable_notification: true,
                            }
                        ).cache((error) => {
                            // nothing
                        });
                    });
                } else {
                    bot.sendMessage(
                        msg.chat.id,
                        payload.text,
                        {
                            reply_to_message_id: msg.message_id,
                            disable_notification: true,
                        }
                    ).cache((error) => {
                        // nothing
                    });
                }
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

for (const i in config.banChat) {
    bot.leaveChat(i).catch((err) => {
        // nothing
    });
}

updateCorpus();

setInterval(updateCorpus, config.talkUpdateInterval);
