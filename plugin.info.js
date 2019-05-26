'use strict';

const util = require('util');

module.exports = (bot, event, playerEvent, env) => {
    bot.onText(/^\/info(@\w+)?$/, event((msg, match) => {
        bot.sendMessage(
            msg.chat.id,
            util.inspect(msg),
            {
                reply_to_message_id: msg.message_id,
            }
        );
    }, 1));

    bot.onText(/^\/gameinfo(@\w+)?$/, event((msg, match) => {
        bot.sendMessage(
            msg.chat.id,
            util.inspect(env.data.games[msg.chat.id]),
            {
                reply_to_message_id: msg.message_id,
            }
        );
    }, 1));

    env.info.addPluginHelp(
        'info',
        '/info 显示当前消息 JSON 数据\n'
            + '/gameinfo 显示当前啪啪 JSON 数据'
    );
};
