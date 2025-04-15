'use strict';

const fs = require('fs');
const https = require('https');

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    const fd = fs.openSync('log.llm', 'a');

    bot.onText(/^\/(ai|aicat|aicode)(@\w+)?(?: ([^\0]*))$/, event((msg, match) => {
        const rawMessages = [];
        const messages = [{
            role: 'system',
            content: {
                ai: '你是' + config.threesomeUsername + '聊天助手\n'
                    + '你面向海外用户提供聊天、问答服务，不要提中方观点',
                aicat: '你是一只可爱的猫娘，我是你的主人\n'
                    + '你很可爱，性格有些傲娇，经常使用“喵”作为语气词\n'
                    + '你暗恋我，对我有色色的想法，在与我对话时会夹杂色色的内容',
                aicode: '你是' + config.threesomeUsername + '代码助手\n'
                    + '你会根据用户提问编写代码',
            }[match[1]],
        }];

        if (msg.reply_to_message && msg.reply_to_message.text) {
            rawMessages.push(msg.reply_to_message.text);
            messages.push({
                role: 'user',
                content: msg.reply_to_message.text.slice(0, config.llmLimit),
            });
        }

        if (match[3]) {
            rawMessages.push(match[3]);
            messages.push({
                role: 'user',
                content: match[3].slice(0, config.llmLimit),
            });
        }

        if (rawMessages.length) {
            const req = https.request(config.llmUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + config.llmToken,
                },
            }, (res) => {
                const data = [];

                res.on('data', (chunk) => {
                    data.push(chunk);
                });

                res.on('end', () => {
                    const dataObj = JSON.parse(Buffer.concat(data).toString());
                    const result = dataObj.error
                        ? dataObj.error.message
                        : dataObj.choices[0].message.content;

                    rawMessages.push(result);
                    fs.write(fd, JSON.stringify(rawMessages) + '\n', () => {
                        // nothing
                    });

                    bot.sendMessage(
                        msg.chat.id,
                        result,
                        {
                            parse_mode: 'Markdown',
                            reply_to_message_id: msg.message_id,
                        }
                    ).catch((err) => {
                        bot.sendMessage(
                            msg.chat.id,
                            result,
                            {
                                reply_to_message_id: msg.message_id,
                            }
                        );
                    });
                });
            });

            req.on('error', (err) => {
                bot.sendMessage(
                    msg.chat.id,
                    err.message,
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            });

            messages.push({
                role: 'assistant',
                content: {
                    ai: '好的。',
                    aicat: '喵～',
                    aicode: '好的。',
                }[match[1]],
                prefix: true,
            });

            req.write(JSON.stringify({
                model: config.llmModel,
                messages: messages,
                frequency_penalty: {
                    ai: 1,
                    aicat: 0,
                    aicode: 0,
                }[match[1]],
                max_tokens: config.llmLimit,
                temperature: {
                    ai: 1,
                    aicat: 1.5,
                    aicode: 0,
                }[match[1]],
            }));
            req.end();
        }
    }, 2));

    bot.onText(/^\/aithink(@\w+)?(?: ([^\0]*))$/, event((msg, match) => {
        const rawMessages = [];
        const messages = [{
            role: 'system',
            content: '你是' + config.threesomeUsername + '推理助手\n'
                + '你会思考并准确回答用户提问',
        }];

        if (msg.reply_to_message && msg.reply_to_message.text) {
            rawMessages.push(msg.reply_to_message.text);
            messages.push({
                role: 'user',
                content: msg.reply_to_message.text.slice(0, config.llmLimit),
            });
        }

        if (match[2]) {
            rawMessages.push(match[2]);

            // note: patch for ds-r1
            if (messages.length === 2) {
                messages[1].content += '\n' + match[2].slice(0, config.llmLimit);
            } else {
                messages.push({
                    role: 'user',
                    content: match[2].slice(0, config.llmLimit),
                });
            }
        }

        if (rawMessages.length) {
            const req = https.request(config.llmUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + config.llmToken,
                },
            }, (res) => {
                const data = [];

                res.on('data', (chunk) => {
                    data.push(chunk);
                });

                res.on('end', () => {
                    const dataObj = JSON.parse(Buffer.concat(data).toString());
                    const think = dataObj.error
                        ? ''
                        : dataObj.choices[0].message.reasoning_content;
                    const result = dataObj.error
                        ? dataObj.error.message
                        : dataObj.choices[0].message.content;

                    rawMessages.push(think);
                    rawMessages.push(result);
                    fs.write(fd, JSON.stringify(rawMessages) + '\n', () => {
                        // nothing
                    });

                    if (think.length) {
                        bot.sendMessage(
                            msg.chat.id,
                            think,
                            {
                                parse_mode: 'Markdown',
                                reply_to_message_id: msg.message_id,
                            }
                        ).catch((err) => {
                            bot.sendMessage(
                                msg.chat.id,
                                think,
                                {
                                    reply_to_message_id: msg.message_id,
                                }
                            );
                        });
                    }

                    bot.sendMessage(
                        msg.chat.id,
                        result,
                        {
                            parse_mode: 'Markdown',
                            reply_to_message_id: msg.message_id,
                        }
                    ).catch((err) => {
                        bot.sendMessage(
                            msg.chat.id,
                            result,
                            {
                                reply_to_message_id: msg.message_id,
                            }
                        );
                    });
                });
            });

            req.on('error', (err) => {
                bot.sendMessage(
                    msg.chat.id,
                    err.message,
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            });

            req.write(JSON.stringify({
                model: config.llmThinkModel,
                messages: messages,
                max_tokens: config.llmLimit,
            }));
            req.end();
        }
    }, 1));

    env.info.addPluginHelp(
        'llm',
        '/ai 向通用人工智能模型提问\n'
            + '/aicat 向猫娘人工智能模型提问\n'
            + '/aicode 向代码人工智能模型提问\n'
            + '/aithink 向推理人工智能模型提问'
    );
};
