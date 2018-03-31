'use strict';

const TelegramBot = require('node-telegram-bot-api');

process.on('uncaughtException', (err) => {
    console.error(Date());
    console.error(err);
});

module.exports = (token) => {
    const bot = new TelegramBot(token, {
        polling: {
            interval: 1000,
        },
    });

    bot.on('error', (err) => {
        if (!(err instanceof TelegramBot.errors.ParseError)) {
            console.error(Date());
            console.error(err);
        }
    });

    bot.on('polling_error', (err) => {
        if (!(err instanceof TelegramBot.errors.ParseError)) {
            console.error(Date());
            console.error(err);
        }
    });

    return bot;
};
