'use strict';

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.werewoofToken);

const group = -1001073512575;
const botname = 'werewoofbot';

process.on('uncaughtException', (err) => {
    console.error(err);
});

const handler = (func) => {
    return (msg, match) => {
        console.log(JSON.stringify(msg));

        if (msg.date >= Date.now() / 1000 - 10) {
            if (msg.text) {
                func(msg, match);

                msg.text = null;
            }
        }
    };
};

const messages = [
    [/./, '神tm#MSG', 0.05, true],
    [/test/, '喵喵喵～', 1, true],
    [/\/start/, '来吸毒啊！', 0.25, false],
    [/\/join/, '快/flee！', 0.1, true],
    [/\/unite/, '我们为什么不能合体！', 1, false],
    [/神tm/, '别学我！', 0.5, true],
    [/插/, '拔出来！', 0.5, true],
    [/^[投出票]/, '投好庄严一票', 0.2, false],
    [/^[投出票]/, '出先知', 0.25, false],
    [/^[跳]/, '跳大神', 0.2, false],
    [/^[跳]/, '跳迪斯科', 0.25, false],
    [/[鸡机基积级集几Jj🐔][巴八吧扒把Bb8]/, '说鸡不说巴，文明你我他', 0.8, true],
    [/[鸡机基积级集几Jj🐔][巴八吧扒把Bb8]/, '说鸡就说巴，文明去他妈', 1, true],
];

for (const i in messages) {
    ((message) => {
        if (Math.random() < messages[i][2]) {
            bot.onText(message[0], handler((msg, match) => {
                bot.sendMessage(
                    group,
                    message[1].replace('#MSG', msg.text),
                    {
                        reply_to_message_id: message[3] ? msg.message_id : null,
                        parse_mode: 'HTML',
                    }
                );
            }));
        }
    })(messages[i]);
}

bot.onText(/./, handler((msg, match) => {
    if (msg.chat.id === group) {
        if (
            msg.reply_to_message
            && msg.reply_to_message.from.username === botname
        ) {
            if (Math.random() < 0.3) {
                bot.sendMessage(
                    group,
                    '么么哒～',
                    {
                        reply_to_message_id: msg.message_id,
                        parse_mode: 'HTML',
                    }
                );
            } if (Math.random() < 0.3) {
                bot.sendMessage(
                    group,
                    'cao你妈～',
                    {
                        reply_to_message_id: msg.message_id,
                        parse_mode: 'HTML',
                    }
                );
            } else {
                bot.sendMessage(
                    group,
                    '神tm ' + msg.text,
                    {
                        reply_to_message_id: msg.message_id,
                        parse_mode: 'HTML',
                    }
                );
            }
        }
    } else {
        bot.sendMessage(
            group,
            msg.text,
            {
                parse_mode: 'HTML',
            }
        );
    }
}));

bot.on('message', (msg) => {
    if (msg.new_chat_member) {
        bot.sendMessage(
            group,
            '让我们祝福这对新人！',
            {
                parse_mode: 'HTML',
            }
        );
    }
});
