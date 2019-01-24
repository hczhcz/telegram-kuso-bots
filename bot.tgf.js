'use strict';

const Tgfancy = require('tgfancy');

process.on('uncaughtException', (err) => {
    console.error(Date());
    console.error(err);
});

module.exports = (token) => {
    const bot = new Tgfancy(token, {
        polling: {
            interval: 1000,
        },
        options: {
            orderedSending: false,
        },
    });

    bot.on('error', (err) => {
        if (!(err instanceof Tgfancy.errors.ParseError)) {
            console.error(Date());
            console.error(err);
        }
    });

    bot.on('polling_error', (err) => {
        if (!(err instanceof Tgfancy.errors.ParseError)) {
            console.error(Date());
            console.error(err);
        }
    });

    return bot;
};
