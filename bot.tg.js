'use strict';

const TelegramBot = require('node-telegram-bot-api');

module.exports = (token) => {
    return new TelegramBot(token, {
        polling: {
            interval: 1000,
        },
    });
};
