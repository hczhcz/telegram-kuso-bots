'use strict';

const child_process = require('child_process');

const config = require('./config');

module.exports = (bot, event, playerEvent, env) => {
    bot.onText(/^\/(calc|clac)(@\w+)? (.+)$/, event((msg, match) => {
        if (match[3].length > config.calcMaxLength) {
            return;
        }

        if (match[1] === 'clac') {
            match[3] = match[3].split().reverse().join();
        }

        const process = child_process.spawn('timeout', ['0.2s', './calc/eigenmath']);
        let result = '';

        process.stdout.on('data', (data) => {
            if (result.length <= config.calcMaxLength) {
                result += data;
            }
        });

        process.on('close', (code) => {
            if (code === 0 && result.length > 0 && result.length <= config.calcMaxLength) {
                if (match[1] === 'clac') {
                    result = result.split().reverse().join();
                }

                bot.sendMessage(
                    msg.chat.id,
                    result,
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            }
        });

        process.stdin.write(match[3]);
    }, 2));

    env.info.addPluginHelp(
        'calc',
        '/calc <expression> 计算\n'
            + '/clac <noisserpxe> 算计'
    );
};
