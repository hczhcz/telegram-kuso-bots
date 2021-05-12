'use strict';

module.exports = (bot) => {
    const self = {
        pluginHelp: [],

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

        addPluginHelp: (plugin, text) => {
            self.pluginHelp.push([plugin, text]);
        },

        welcome: (msg) => {
            return bot.sendMessage(
                msg.chat.id,
                '欢迎使用 Threesome Bot～\n'
                    + '\n'
                    + '/startthreesome 启动 3P 模式\n'
                    + '/help 显示帮助\n'
                    + '\n'
                    + '源码：\n'
                    + 'https://github.com/hczhcz/telegram-kuso-bots',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },

        help: (msg) => {
            let text = '命令列表：\n'
                + '/startmasturbate 启动一场撸管\n'
                + '/startsex 启动一场啪啪\n'
                + '/startthreesome 启动 3P 模式\n'
                + '/startgroupsex 启动 群P 模式\n'
                + '/start100kills 启动 百人斩 模式\n'
                + '/nextsex 我想滚床单\n'
                + '/join 加入滥交派对\n'
                + '/flee 进入贤者时间\n'
                + '/invite 把 被回复的人 推倒\n'
                + '/smite 把 被回复的人 踢下床\n'
                + '/forcestart 人家迫不及待了啦\n'
                + '/forcefallback 不管多少人都要啪\n'
                + '/forceorgasm 强 制 高 潮\n'
                + '/stat 查看统计信息\n'
                + '/listall 列出全部 trigger 命令\n'
                + '/list <trigger> 列出 trigger 内容\n'
                + '/add <trigger>@<content> 添加本地 trigger\n'
                + '/adds <trigger>@<content> 添加全网共享 trigger\n'
                + '/del <trigger>@<content> 删除本地 trigger\n'
                + '/dels <trigger>@<content> 删除全网共享 trigger\n'
                + '/welcome 显示欢迎信息\n'
                + '/help 显示帮助\n'
                + '/status 查看 bot 状态\n'
                + '\n'
                + '备注：\n'
                + '如果 <trigger> 为空，将 trigger 加入 bot自言自语\n'
                + 'bot自言自语 即为啪啪时显示的内容\n'
                + '如果 @<content> 为空，将回复的消息加入 trigger\n\n';

            for (const i in self.pluginHelp) {
                text += '插件 ' + self.pluginHelp[i][0] + '\n'
                    + self.pluginHelp[i][1] + '\n\n';
            }

            text += '源码：\n'
                + 'https://github.com/hczhcz/telegram-kuso-bots';

            return bot.sendMessage(
                msg.chat.id,
                text,
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

        banned: (msg) => {
            return bot.sendMessage(
                msg.chat.id,
                '妈的 JB 都没你啪个毛',
                {
                    reply_to_message_id: msg.message_id,
                }
            );
        },
    };

    return self;
};
