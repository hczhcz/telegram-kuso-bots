'use strict';

const Wechat = require('wechat4u');
const qrcode = require('qrcode-terminal');

process.on('uncaughtException', (err) => {
    console.error(Date());
    console.error(err);
});

module.exports = () => {
    const bot = new Wechat();

    bot.start();

    bot.on('uuid', (uuid) => {
        qrcode.generate(
            'https://login.weixin.qq.com/l/' + uuid,
            {
                small: true,
            },
            (qr) => {
                console.warn(qr);
            }
        );
    });

    bot.onText = (re, event) => {
        bot.on('message', (msg) => {
            if (
                !msg.isSendBySelf
                && msg.MsgType === bot.CONF.MSGTYPE_TEXT
            ) {
                // mock
                msg.message_id = 0;

                const tgUser = (user) => {
                    return {
                        username: bot.contacts[user].getDisplayName(),
                        first_name: bot.contacts[user].getDisplayName(),
                        id: user,
                    };
                };

                const tgGroup = (user) => {
                    return {
                        username: bot.contacts[user].getDisplayName(),
                        first_name: bot.contacts[user].getDisplayName(),
                        id: user,
                    };
                };

                if (msg.FromUserName.slice(0, 2) === '@@') {
                    const content = msg.OriginalContent.split(':<br/>');

                    msg.from = tgUser(content[0]);
                    msg.chat = tgGroup(msg.FromUserName);
                    msg.text = content[1];
                } else {
                    msg.from = tgUser(msg.FromUserName);
                    msg.chat = tgUser(msg.FromUserName);
                    msg.text = msg.Content;
                }

                const match = msg.text.match(re);

                if (match) {
                    event(msg, match);
                }
            }
        });
    };

    bot.sendMessage = (user, text, options) => {
        // TODO: callback query

        return bot.sendText(text, user);
    };

    bot.getChatAdministrators = (chat) => {
        // notice: temporary solution
        // TODO

        return Promise.resolve([]);
    };

    bot.on('login', () => {
        console.warn('login');
    });

    bot.on('logout', () => {
        console.warn('logout');
    });

    return bot;
};
