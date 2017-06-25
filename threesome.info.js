'use strict';

module.exports = (bot) => {
    return {
        na: (msg) => {
            return bot.sendMessage(
                msg.chat.id,
                '目前没有床上运动进行中，\n'
                    + '/startmasturbate 启动一场撸管\n'
                    + '/startsex 启动一场啪啪\n'
                    + '/startthreesome 启动 3P 模式\n'
                    + '/startgroupsex 启动 群P 模式\n'
                    + '/start100kills 启动 百人斩 模式',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },

        next: (msg) => {
            return bot.sendMessage(
                msg.chat.id,
                '我不会通知你的，请洗干净自己来',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },
    };
};
