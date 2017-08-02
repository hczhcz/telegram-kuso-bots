'use strict';

module.exports = (bot, stats) => {
    return {
        stat: (msg, player) => {
            const statSize = (data) => {
                let count = 0;
                let max = 0;
                let sum = 0;

                for (const i in data) {
                    count += data[i];
                    max = Math.max(max, i);
                    sum += i * data[i];
                }

                const ave = Math.round(sum / count * 100) * 0.01;

                return {
                    count: count,
                    max: max,
                    ave: ave,
                };
            };

            const statTop = (data, level) => {
                let count = 0;
                let top1 = [0];
                let top2 = [0];
                let top3 = [0];

                const stat = (item) => {
                    count += item[0];

                    if (item[0] > top1[0]) {
                        top3 = top2;
                        top2 = top1;
                        top1 = item;
                    } else if (item[0] > top2[0]) {
                        top3 = top2;
                        top2 = item;
                    } else if (item[0] > top3[0]) {
                        top3 = item;
                    }
                };

                if (level === 3) {
                    for (const i in data) {
                        for (const j in data) {
                            for (const k in data) {
                                stat([data[i][j][k], i, j, k]);
                            }
                        }
                    }
                } else if (level === 2) {
                    for (const i in data) {
                        for (const j in data) {
                            stat([data[i][j], i, j]);
                        }
                    }
                } else {
                    for (const i in data) {
                        stat([data[i], i]);
                    }
                }

                return {
                    count: count,
                    top1: top1,
                    top2: top2,
                    top3: top3,
                };
            };

            const gameStat = stats.game[msg.chat.id];
            const commandStat = stats.command[msg.chat.id];
            const inlineStat = stats.inline[player.id];

            if (player) {
                const gameUserStat = statSize(gameStat.user[player.id]);
                const gamePairStat = statTop(gameStat.pair[player.id], 1);
                const commandUserStat = statTop(commandStat.user[player.id], 1);
                const commandPairStat = statTop(commandStat.pair[player.id], 2);
                const commandReplyStat = statTop(commandStat.reply[player.id], 1);
                const commandreplyPairStat = statTop(commandStat.replyPair[player.id], 2);
                const inlineUserStat = statSize(inlineStat);

                return bot.sendMessage(
                    msg.chat.id,
                    '',
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            } else {
                const gameChatStat = statSize(gameStat.chat);
                const gameUserTotalStat = statTop(gameStat.userTotal, 1);
                const gamePairStat = statTop(gameStat.pair, 2);
                const commandChatStat = statTop(commandStat.chat, 1);
                const commandUserStat = statTop(commandStat.user, 2);
                const commandPairStat = statTop(commandStat.pair, 3);
                const commandReplyStat = statTop(commandStat.reply, 2);
                const commandreplyPairStat = statTop(commandStat.replyPair, 3);

                return bot.sendMessage(
                    msg.chat.id,
                    '',
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            }
        },
    };
};
