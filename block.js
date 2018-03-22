'use strict';

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.blockToken);

let enable = true;

bot.on('message', (msg) => {
    if (enable && config.block[msg.from.id]) {
        console.log('[' + Date() + '] ' + msg.chat.id + ':' + msg.from.id + ' ' + msg.text);

        bot.deleteMessage(msg.chat.id, msg.message_id);
    }
});

bot.onText(/^\/ban(@\w+)?$/, (msg, match) => {
    if (config.blockAdmin[msg.from.id]) {
        console.log('[' + Date() + '] ' + msg.chat.id + ':' + msg.from.id + ' ban');

        enable = true;
    }
});

bot.onText(/^\/unban(@\w+)?$/, (msg, match) => {
    if (config.blockAdmin[msg.from.id]) {
        console.log('[' + Date() + '] ' + msg.chat.id + ':' + msg.from.id + ' unban');

        enable = false;
    }
});
