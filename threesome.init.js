'use strict';

module.exports = (bot, games) => {
    return {
        masturbate: (msg) => {
            games[msg.chat.id] = {
                usercount: 0,
                users: {},
                modename: '撸管',
                modemin: 1,
                modemax: 1,
                time: -120,
            };

            return bot.sendMessage(
                msg.chat.id,
                msg.from.first_name + ' 决定自己撸一炮！',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },

        sex: (msg) => {
            games[msg.chat.id] = {
                usercount: 0,
                users: {},
                modename: '滚床单活动',
                modemin: 2,
                modemax: 2,
                time: -150,
            };

            return bot.sendMessage(
                msg.chat.id,
                msg.from.first_name + ' 已经启动了一场约炮！'
                    + '输入指令 /join 来参加这场床单盛宴...'
                    + '不排除有怀孕的可能 :P',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },

        threesome: (msg) => {
            games[msg.chat.id] = {
                usercount: 0,
                users: {},
                modename: '这场 3P',
                modemin: 3,
                modemax: 3,
                time: -180,
            };

            return bot.sendMessage(
                msg.chat.id,
                '在 ' + msg.from.first_name + ' 的带领下，'
                    + '3P 模式正式启动！'
                    + '输入 /join，群里的禽兽们将会全面进场！',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },

        groupsex: (msg) => {
            games[msg.chat.id] = {
                usercount: 0,
                users: {},
                modename: '这场群P',
                modemin: 3,
                modemax: 100,
                time: -180,
            };

            return bot.sendMessage(
                msg.chat.id,
                '在 ' + msg.from.first_name + ' 的带领下，'
                    + '群P 模式正式启动！'
                    + '输入 /join，群里的禽兽们将会全面进场！',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },

        kills: (msg) => {
            games[msg.chat.id] = {
                usercount: 0,
                users: {},
                modename: '百人斩',
                modemin: 100,
                modemax: 100,
                time: -180,
            };

            return bot.sendMessage(
                msg.chat.id,
                '在 ' + msg.from.first_name + ' 的带领下，'
                    + '百人斩模式正式启动！'
                    + '输入 /join，成为这场豪华盛宴的百分之一！',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },
    };
};
