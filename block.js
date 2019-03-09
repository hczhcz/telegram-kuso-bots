'use strict';

const fs = require('fs');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.blockToken);

const fd = fs.openSync('log_block', 'a');

const log = (head, body) => {
    fs.write(fd, '[' + Date() + '] ' + head + ' ' + body + '\n', () => {
        // nothing
    });
};

let enable = true;

bot.on('message', (msg) => {
    if (enable && config.block[msg.from.id]) {
        log(
            msg.chat.id + ':' + msg.from.id,
            msg.text
        );

        bot.deleteMessage(msg.chat.id, msg.message_id);
    }
});

bot.onText(/^\/ban(@\w+)?$/, (msg, match) => {
    if (config.admin[msg.from.id]) {
        log(
            msg.chat.id + ':' + msg.from.id,
            'ban'
        );

        enable = true;
    }
});

bot.onText(/^\/unban(@\w+)?$/, (msg, match) => {
    if (config.admin[msg.from.id]) {
        log(
            msg.chat.id + ':' + msg.from.id,
            'unban'
        );

        enable = false;
    }
});
