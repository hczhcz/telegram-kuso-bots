'use strict';

module.exports = (bot, event, playerEvent, env) => {
    const stickerEvent = event((msg, match) => {
        bot.sendDocument(
            msg.chat.id,
            bot.getFileStream(msg.sticker.file_id),
            {},
            {
                filename: msg.sticker.file_id + '.webp',
            }
        );
    }, -1);

    bot.on('message', (msg) => {
        if (msg.chat.id === msg.from.id && msg.sticker) {
            stickerEvent(msg, []);
        }
    });

    env.info.addPluginHelp(
        'sticker',
        '<sticker> （私聊）获取表情文件'
    );
};
