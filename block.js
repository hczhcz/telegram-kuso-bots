'use strict';

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.blockToken);

process.on('uncaughtException', (err) => {
    console.err(err);
});

bot.on('message', (msg) => {
    if (config.block[msg.from.id]) {
        console.log('[' + Date() + '] ' + msg.chat.id + ':' + msg.from.id + ' ' + msg.text);

        bot.deleteMessage(msg.chat.id, msg.message_id);
    }
});
