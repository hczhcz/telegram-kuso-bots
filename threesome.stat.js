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

                const ave = Math.round(sum / count * 100) / 100 || 0;

                return {
                    count: count,
                    max: max,
                    ave: ave,
                };
            };

            const statTop = (data, level, symmetry) => {
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
                        for (const j in data[i]) {
                            for (const k in data[i][j]) {
                                stat([data[i][j][k], i, j, k]);
                            }
                        }
                    }
                } else if (level === 2) {
                    for (const i in data) {
                        for (const j in data[i]) {
                            if (!symmetry || i < j) {
                                stat([data[i][j], i, j]);
                            }
                        }
                    }
                } else if (level === 1) {
                    for (const i in data) {
                        stat([data[i], i]);
                    }
                } else {
                    // never reach
                    throw Error();
                }

                return {
                    count: count,
                    top1: top1,
                    top2: top2,
                    top3: top3,
                };
            };

            if (player) {
                const gameStat = stats.game[msg.chat.id];
                const commandStat = stats.command[msg.chat.id];
                const inlineStat = stats.inline[player.id];

                const gameUserStat = statSize(gameStat.user[player.id]);
                const gamePairStat = statTop(gameStat.pair[player.id], 1);
                const commandUserStat = statTop(commandStat.user[player.id], 1);
                const commandPairStat = statTop(commandStat.pair[player.id], 2);
                const commandReplyStat = statTop(commandStat.reply[player.id], 1);
                const commandReplyPairStat = statTop(commandStat.replyPair[player.id], 2);
                const inlineUserStat = statSize(inlineStat);

                return bot.sendMessage(
                    msg.chat.id,
                    (stats.name[player.id] || '') + ' 啪啪了 ' + gameUserStat.count + ' 次，其中：\n'
                        + '3P 有 ' + (gameStat.user[player.id][3] || 0) + ' 次\n'
                        + '2P 有 ' + (gameStat.user[player.id][2] || 0) + ' 次\n'
                        + '撸管 有 ' + (gameStat.user[player.id][1] || 0) + ' 次\n'
                        + (stats.name[player.id] || '') + ' 最多参与过 ' + gameUserStat.max + 'P\n'
                        + '每次啪啪平均 ' + gameUserStat.ave + ' 人\n\n'

                        + (stats.name[player.id] || '') + ' 最喜欢的性伴侣是：\n'
                        + (stats.name[gamePairStat.top1[1]] || '') + '（' + (gamePairStat.top1[0] || 0) + ' 次）\n'
                        + (stats.name[gamePairStat.top2[1]] || '') + '（' + (gamePairStat.top2[0] || 0) + ' 次）\n'
                        + (stats.name[gamePairStat.top3[1]] || '') + '（' + (gamePairStat.top3[0] || 0) + ' 次）\n\n'

                        + (stats.name[player.id] || '') + ' 触发过 ' + commandUserStat.count + ' 个 trigger，最多的 trigger 是：\n'
                        + (commandUserStat.top1[1] || '') + '（' + (commandUserStat.top1[0] || 0) + ' 次）\n'
                        + (commandUserStat.top2[1] || '') + '（' + (commandUserStat.top2[0] || 0) + ' 次）\n'
                        + (commandUserStat.top3[1] || '') + '（' + (commandUserStat.top3[0] || 0) + ' 次）\n\n'

                        + '其中，' + (stats.name[player.id] || '') + ' 经常：\n'
                        + (commandPairStat.top1[2] || '') + ' ' + (stats.name[commandPairStat.top1[1]] || '')
                        + '（' + (commandPairStat.top1[0] || 0) + ' 次）\n'
                        + (commandPairStat.top2[2] || '') + ' ' + (stats.name[commandPairStat.top2[1]] || '')
                        + '（' + (commandPairStat.top2[0] || 0) + ' 次）\n'
                        + (commandPairStat.top3[2] || '') + ' ' + (stats.name[commandPairStat.top3[1]] || '')
                        + '（' + (commandPairStat.top3[0] || 0) + ' 次）\n\n'

                        + (stats.name[player.id] || '') + ' 接受过 ' + commandReplyStat.count + ' 个 trigger，最多的 trigger 是：\n'
                        + (commandReplyStat.top1[1] || '') + '（' + (commandReplyStat.top1[0] || 0) + ' 次）\n'
                        + (commandReplyStat.top2[1] || '') + '（' + (commandReplyStat.top2[0] || 0) + ' 次）\n'
                        + (commandReplyStat.top3[1] || '') + '（' + (commandReplyStat.top3[0] || 0) + ' 次）\n\n'

                        + '其中，' + (stats.name[player.id] || '') + ' 经常：\n'
                        + '被 ' + (stats.name[commandReplyPairStat.top1[1]] || '') + ' ' + (commandReplyPairStat.top1[2] || '')
                        + '（' + (commandReplyPairStat.top1[0] || 0) + ' 次）\n'
                        + '被 ' + (stats.name[commandReplyPairStat.top2[1]] || '') + ' ' + (commandReplyPairStat.top2[2] || '')
                        + '（' + (commandReplyPairStat.top2[0] || 0) + ' 次）\n'
                        + '被 ' + (stats.name[commandReplyPairStat.top3[1]] || '') + ' ' + (commandReplyPairStat.top3[2] || '')
                        + '（' + (commandReplyPairStat.top3[0] || 0) + ' 次）\n\n'

                        + (stats.name[player.id] || '') + ' 呻吟了 ' + inlineUserStat.count + ' 次\n'
                        + '最长的呻吟有 ' + inlineUserStat.max + ' 段\n'
                        + '平均呻吟长度 ' + inlineUserStat.ave + ' 段',
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            } else {
                const gameStat = stats.game[msg.chat.id];
                const commandStat = stats.command[msg.chat.id];

                const gameChatStat = statSize(gameStat.chat);
                const gameUserTotalStat = statTop(gameStat.userTotal, 1);
                const gamePairStat = statTop(gameStat.pair, 2, true);
                const commandChatStat = statTop(commandStat.chat, 1);
                const commandUserStat = statTop(commandStat.user, 2);
                const commandPairStat = statTop(commandStat.pair, 3);
                const commandReplyStat = statTop(commandStat.reply, 2);

                return bot.sendMessage(
                    msg.chat.id,
                    '本群总共啪啪了 ' + gameChatStat.count + ' 次，其中：\n'
                        + '3P 有 ' + (gameStat.chat[3] || 0) + ' 次\n'
                        + '2P 有 ' + (gameStat.chat[2] || 0) + ' 次\n'
                        + '撸管 有 ' + (gameStat.chat[1] || 0) + ' 次\n'
                        + '本群最多发生过 ' + gameChatStat.max + 'P\n'
                        + '每次啪啪平均 ' + gameChatStat.ave + ' 人\n\n'

                        + '本群最勤劳的是：\n'
                        + (stats.name[gameUserTotalStat.top1[1]] || '') + '（' + (gameUserTotalStat.top1[0] || 0) + ' 次）\n'
                        + (stats.name[gameUserTotalStat.top2[1]] || '') + '（' + (gameUserTotalStat.top2[0] || 0) + ' 次）\n'
                        + (stats.name[gameUserTotalStat.top3[1]] || '') + '（' + (gameUserTotalStat.top3[0] || 0) + ' 次）\n\n'

                        + '本群最缠绵的是：\n'
                        + (stats.name[gamePairStat.top1[1]] || '') + ' 和 ' + (stats.name[gamePairStat.top1[2]] || '')
                        + '（' + (gamePairStat.top1[0] || 0) + ' 次）\n'
                        + (stats.name[gamePairStat.top2[1]] || '') + ' 和 ' + (stats.name[gamePairStat.top2[2]] || '')
                        + '（' + (gamePairStat.top2[0] || 0) + ' 次）\n'
                        + (stats.name[gamePairStat.top3[1]] || '') + ' 和 ' + (stats.name[gamePairStat.top3[2]] || '')
                        + '（' + (gamePairStat.top3[0] || 0) + ' 次）\n\n'

                        + '所有人总共触发过 ' + commandChatStat.count + ' 个 trigger，最多的 trigger 是：\n'
                        + (commandChatStat.top1[1] || '') + '（' + (commandChatStat.top1[0] || 0) + ' 次）\n'
                        + (commandChatStat.top2[1] || '') + '（' + (commandChatStat.top2[0] || 0) + ' 次）\n'
                        + (commandChatStat.top3[1] || '') + '（' + (commandChatStat.top3[0] || 0) + ' 次）\n\n'

                        + '本群的日常是：\n'
                        + (stats.name[commandUserStat.top1[1]] || '') + ' 喜欢 ' + (commandUserStat.top1[2] || '')
                        + '（' + (commandUserStat.top1[0] || 0) + ' 次）\n'
                        + (stats.name[commandUserStat.top2[1]] || '') + ' 喜欢 ' + (commandUserStat.top2[2] || '')
                        + '（' + (commandUserStat.top2[0] || 0) + ' 次）\n'
                        + (stats.name[commandUserStat.top3[1]] || '') + ' 喜欢 ' + (commandUserStat.top3[2] || '')
                        + '（' + (commandUserStat.top3[0] || 0) + ' 次）\n'

                        + (stats.name[commandPairStat.top1[1]] || '') + ' 经常 '
                        + (commandPairStat.top1[3] || '') + ' ' + (stats.name[commandPairStat.top1[2]] || '')
                        + '（' + (commandPairStat.top1[0] || 0) + ' 次）\n'
                        + (stats.name[commandPairStat.top2[1]] || '') + ' 经常 '
                        + (commandPairStat.top2[3] || '') + ' ' + (stats.name[commandPairStat.top2[2]] || '')
                        + '（' + (commandPairStat.top2[0] || 0) + ' 次）\n'
                        + (stats.name[commandPairStat.top3[1]] || '') + ' 经常 '
                        + (commandPairStat.top3[3] || '') + ' ' + (stats.name[commandPairStat.top3[2]] || '')
                        + '（' + (commandPairStat.top3[0] || 0) + ' 次）\n'

                        + (stats.name[commandReplyStat.top1[1]] || '') + ' 常被 ' + (commandReplyStat.top1[2] || '')
                        + '（' + (commandReplyStat.top1[0] || 0) + ' 次）\n'
                        + (stats.name[commandReplyStat.top2[1]] || '') + ' 常被 ' + (commandReplyStat.top2[2] || '')
                        + '（' + (commandReplyStat.top2[0] || 0) + ' 次）\n'
                        + (stats.name[commandReplyStat.top3[1]] || '') + ' 常被 ' + (commandReplyStat.top3[2] || '')
                        + '（' + (commandReplyStat.top3[0] || 0) + ' 次）',
                    {
                        reply_to_message_id: msg.message_id,
                    }
                );
            }
        },
    };
};
