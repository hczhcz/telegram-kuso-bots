'use strict';

module.exports = (bot, event, playerEvent, env) => {
    bot.on('message', (msg) => {
        if (msg.chat.id === msg.from.id && msg.sticker) {
            bot.sendDocument(
                msg.chat.id,
                msg.sticker.thumb.file_id
            );
        }
    });

    env.info.addPluginHelp(
        'sticker',
        '<sticker> （私聊）获取表情文件'
    );
};
