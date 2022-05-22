'use strict';

module.exports = (bot, event, playerEvent, env) => {
    bot.onText(/^\/bionic(@\w+)?$/, event((msg, match) => {
        if (msg.reply_to_message && msg.reply_to_message.text) {
            const originalEntities = msg.reply_to_message.entities || [];
            const entities = [];
            const re = /\w{2,}/g;
            let wordMatch = re.exec(msg.reply_to_message.text);

            while (wordMatch) {
                let ok = true;

                for (const i in originalEntities) {
                    const entity = originalEntities[i];

                    if (
                        wordMatch.index < entity.offset + entity.length
                        && wordMatch.index + wordMatch[0].length >= entity.offset
                    ) {
                        ok = false;
                        break;
                    }
                }

                if (ok) {
                    entities.push({
                        type: 'bold',
                        offset: wordMatch.index,
                        length: Math.floor(wordMatch[0].length / 2),
                    });
                }

                wordMatch = re.exec(msg.reply_to_message.text);
            }

            bot.sendMessage(
                msg.chat.id,
                msg.reply_to_message.text,
                {
                    // workaround
                    entities: JSON.stringify(originalEntities.concat(entities)),
                    reply_to_message_id: msg.message_id,
                }
            );
        }
    }, 1));

    env.info.addPluginHelp(
        'bionic',
        '/bionic 将回复消息转为 bionic 风格'
    );
};
