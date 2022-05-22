'use strict';

module.exports = (bot, event, playerEvent, env) => {
    bot.onText(/^\/bionic(@\w+)?$/, event((msg, match) => {
        if (msg.reply_to_message && msg.reply_to_message.text) {
            const re = /\w+/g;
            let wordMatch = re.exec(msg.reply_to_message.text);
            const entities = [];

            while (wordMatch) {
                let ok = true;

                for (const i in msg.reply_to_message.entities) {
                    const entity = msg.reply_to_message.entities[i];

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
                        offset: wordMatch.index,
                        length: wordMatch[0].length,
                        type: 'bold',
                    });
                }

                wordMatch = re.exec(msg.reply_to_message.text);
            }

            bot.sendMessage(
                msg.chat.id,
                msg.reply_to_message.text,
                {
                    entities: msg.reply_to_message.entities.concat(entities),
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
