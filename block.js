'use strict';

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.blockToken);

process.on('uncaughtException', (err) => {
    console.error(err);
});

let enable = true;

bot.on('message', (msg) => {
    if (enable && config.block[msg.from.id]) {
        console.log('[' + Date() + '] ' + msg.chat.id + ':' + msg.from.id + ' ' + msg.text);

        bot.deleteMessage(msg.chat.id, msg.message_id);
    }
});

bot.onText(/\/ban/, (msg, match) => {
    if (config.blockAdmin[msg.from.id]) {
        console.log('[' + Date() + '] ' + msg.chat.id + ':' + msg.from.id + ' ban');

        enable = true;
    }
});

bot.onText(/\/unban/, (msg, match) => {
    if (config.blockAdmin[msg.from.id]) {
        console.log('[' + Date() + '] ' + msg.chat.id + ':' + msg.from.id + ' unban');

        enable = false;
    }
});
