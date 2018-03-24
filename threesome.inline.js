'use strict';

module.exports = (bot) => {
    return {
        answer: (query) => {
            const randomSeparator = () => {
                const content = [
                    '…', '…', '…', '…', '…', '…',
                    '……', '……', '……', '……',
                    '………', '………',
                    '！', '！！',
                    '、、', '、、、',
                ];

                return content[Math.floor(Math.random() * content.length)];
            };

            const randomText = () => {
                const content = [
                    '啊', '啊', '啊', '啊', '啊',
                    '啊啊', '啊啊', '啊啊', '啊啊',
                    '啊啊啊', '啊啊啊', '啊啊啊',
                    '嗯', '嗯', '嗯', '嗯',
                    '嗯嗯', '嗯嗯',
                    '唔', '唔',
                    '唔嗯', '唔嗯',
                    '唔哇', '唔哇',
                    '哇啊', '哇啊啊',
                    '好舒服', '好棒', '继续', '用力', '不要停',
                    '不要', '那里不可以', '好变态', '要坏掉啦',
                ];

                let text = content[Math.floor(Math.random() * content.length)];

                while (text.length < 20 && Math.random() < 0.25) {
                    text += randomSeparator() + content[Math.floor(Math.random() * content.length)];
                }

                return text;
            };

            let text = randomText() + randomSeparator();

            let tokens = null;

            // notice: the implementation in the stats module should be consistent with this one
            if (query.query.match('@')) {
                tokens = query.query.split('@');
            } else {
                tokens = query.query.split(' ');
            }

            for (const i in tokens) {
                if (tokens[i]) {
                    text += tokens[i] + randomSeparator() + randomText() + randomSeparator();
                }
            }

            return bot.answerInlineQuery(query.id, [{
                type: 'article',
                id: 'CONTENT',
                title: '娇喘',
                input_message_content: {
                    message_text: text,
                },
            }], {
                cache_time: 0,
                is_personal: true,
            });
        },

        banned: (query) => {
            return bot.answerInlineQuery(query.id, [{
                type: 'article',
                id: 'BANNED',
                title: '娇喘',
                input_message_content: {
                    message_text: '妈的 JB 都没我啪个毛',
                },
            }], {
                cache_time: 0,
                is_personal: true,
            });
        },
    };
};
