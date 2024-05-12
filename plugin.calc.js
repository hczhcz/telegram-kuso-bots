'use strict';

const child_process = require('child_process');

const config = require('./config');

const runCalc = (path, expression, onDone, onFail) => {
    const process = child_process.spawn('timeout', ['0.2s', path]);
    let result = '';

    process.stdout.on('data', (data) => {
        if (result.length <= config.calcMaxLength) {
            result += data;
        }
    });

    process.on('close', (code) => {
        if (code === 0 && result && result.length <= config.calcMaxLength) {
            onDone(result);
        } else {
            onFail();
        }
    });

    process.stdin.write(expression + '\n');
};

module.exports = (bot, event, playerEvent, env) => {
    bot.onText(/^\/(calc|clac)(@\w+)? ([^\0]+)$/, event((msg, match) => {
        if (match[3].length > config.calcMaxLength) {
            return;
        }

        if (match[1] === 'clac') {
            match[3] = match[3].split('').reverse().join('');
        }

        runCalc('calc/eigenmath', match[3], (result) => {
            // done

            bot.sendMessage(
                msg.chat.id,
                match[1] === 'clac'
                    ? result.split('').reverse().join('')
                    : result,
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        }, () => {
            // fail

            runCalc('calc/eigenmath_format', match[3], (result) => {
                // done

                bot.sendMessage(
                    msg.chat.id,
                    match[1] === 'clac'
                        ? result.split('').reverse().join('')
                        : result,
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            }, () => {
                // fail
            });
        });
    }, 2));

    env.info.addPluginHelp(
        'calc',
        '/calc <expression> 计算\n'
            + '/clac <noisserpxe> 算计'
    );
};
