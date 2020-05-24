'use strict';

const util = require('util');

module.exports = (bot, event, playerEvent, env) => {
    bot.onText(/^\/info(@\w+)?((?: (?!_)\w+)*)$/, event((msg, match) => {
        let info = msg;

        if (info.reply_to_message) {
            info = info.reply_to_message;
        }

        const path = match[2].split(' ').slice(1);

        for (const i in path) {
            if (Object.hasOwnProperty.bind(info)(path[i])) {
                info = info[path[i]];
            }
        }

        bot.sendMessage(
            msg.chat.id,
            util.inspect(info),
            {
                reply_to_message_id: msg.message_id,
            }
        );
    }, 1));

    bot.onText(/^\/gameinfo(@\w+)?((?: (?!_)\w+)*)$/, event((msg, match) => {
        let info = env.data.games[msg.chat.id];

        const path = match[2].split(' ').slice(1);

        for (const i in path) {
            if (Object.hasOwnProperty.bind(info)(path[i])) {
                info = info[path[i]];
            }
        }

        bot.sendMessage(
            msg.chat.id,
            util.inspect(info),
            {
                reply_to_message_id: msg.message_id,
            }
        );
    }, 1));

    env.info.addPluginHelp(
        'info',
        '/info 显示当前消息或回复消息 JSON 数据\n'
            + '/info <path> 按路径访问当前消息或回复消息 JSON 数据\n'
            + '/gameinfo 显示当前啪啪 JSON 数据\n'
            + '/gameinfo <path> 按路径访问当前啪啪 JSON 数据'
    );
};
