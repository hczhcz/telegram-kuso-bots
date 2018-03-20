'use strict';

const TelegramBot = require('node-telegram-bot-api');

process.on('uncaughtException', (err) => {
    console.error(Date());
    console.error(err);
});

module.exports = (token) => {
    return new TelegramBot(token, {
        polling: {
            interval: 1000,
        },
    });
};
