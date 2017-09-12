'use strict';

const fs = require('fs');
const readline = require('readline');

module.exports = (pathCals) => {
    const fdCals = fs.openSync(pathCals, 'a');

    const ActionError = function (info) {
        if (this) {
            this.info = info;
        } else {
            return new ActionError(info);
        }
    };

    ActionError.prototype = new Error();

    const self = {
        calenders: [
            {
                creator: 0,
                owner: 0,
                id: 'codercal',
                title: '程序员老黄历',
                dictionaries: [
                    {
                        id: 'vars',
                        random: 12,
                        items: ['jieguo', 'huodong', 'pay', 'expire', 'zhangdan', 'every', 'free', 'i1', 'a', 'virtual', 'ad', 'spider', 'mima', 'pass', 'ui'],
                    },
                    {
                        id: 'tools',
                        random: 11,
                        items: ['Eclipse 写程序', 'MSOffice 写文档', '记事本 写程序', 'Windows8', 'Linux', 'MacOS', 'IE', 'Android 设备', 'iOS 设备'],
                    },
                    {
                        id: 'lengths',
                        random: 12,
                        items: [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276],
                    },
                    {
                        id: 'directions',
                        random: 2,
                        items: ['北方', '东北方', '东方', '东南方', '南方', '西南方', '西方', '西北方'],
                    },
                    {
                        id: 'drinks',
                        pick: 2,
                        items: ['水', '茶', '红茶', '绿茶', '咖啡', '奶茶', '可乐', '鲜奶', '豆奶', '果汁', '果味汽水', '苏打水', '运动饮料', '酸奶', '酒'],
                    },
                    {
                        id: 'stars',
                        random: 6,
                        items: ['★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★'],
                    },
                ],
                activities: [
                    {
                        name: '写单元测试',
                        good: '写单元测试将减少出错',
                        bad: '写单元测试会降低你的开发效率',
                        weekday: true,
                    },
                    {
                        name: '洗澡',
                        good: '你几天没洗澡了？',
                        bad: '会把设计方面的灵感洗掉',
                        weekday: true,
                        weekend: true,
                    },
                    {
                        name: '锻炼一下身体',
                        good: '',
                        bad: '能量没消耗多少，吃得却更多',
                        weekday: true,
                        weekend: true,
                    },
                    {
                        name: '抽烟',
                        good: '抽烟有利于提神，增加思维敏捷',
                        bad: '除非你活够了，死得早点没关系',
                        weekday: true,
                        weekend: true,
                    },
                    {
                        name: '白天上线',
                        good: '今天白天上线是安全的',
                        bad: '可能导致灾难性后果',
                        weekday: true,
                    },
                    {
                        name: '重构',
                        good: '代码质量得到提高',
                        bad: '你很有可能会陷入泥潭',
                        weekday: true,
                    },
                    {
                        name: '使用 %tools%',
                        good: '你看起来更有品位',
                        bad: '别人会觉得你在装逼',
                        weekday: true,
                    },
                    {
                        name: '跳槽',
                        good: '该放手时就放手',
                        bad: '鉴于当前的经济形势，你的下一份工作未必比现在强',
                        weekday: true,
                    },
                    {
                        name: '招人',
                        good: '你面前这位有成为牛人的潜质',
                        bad: '这人会写程序吗？',
                        weekday: true,
                    },
                    {
                        name: '面试',
                        good: '面试官今天心情很好',
                        bad: '面试官不爽，会拿你出气',
                        weekday: true,
                    },
                    {
                        name: '提交辞职申请',
                        good: '公司找到了一个比你更能干更便宜的家伙，巴不得你赶快滚蛋',
                        bad: '鉴于当前的经济形势，你的下一份工作未必比现在强',
                        weekday: true,
                    },
                    {
                        name: '申请加薪',
                        good: '老板今天心情很好',
                        bad: '公司正在考虑裁员',
                        weekday: true,
                    },
                    {
                        name: '晚上加班',
                        good: '晚上是程序员精神最好的时候',
                        bad: '',
                        weekday: true,
                        weekend: true,
                    },
                    {
                        name: '在妹子面前吹牛',
                        good: '改善你矮穷挫的形象',
                        bad: '会被识破',
                        weekday: true,
                        weekend: true,
                    },
                    {
                        name: '撸管',
                        good: '避免缓冲区溢出',
                        bad: '强撸灰飞烟灭',
                        weekday: true,
                        weekend: true,
                    },
                    {
                        name: '浏览成人网站',
                        good: '重拾对生活的信心',
                        bad: '你会心神不宁',
                        weekday: true,
                        weekend: true,
                    },
                    {
                        name: '命名变量 \'%vars%\'',
                        good: '',
                        bad: '',
                        weekday: true,
                    },
                    {
                        name: '写超过 %lengths% 行的方法',
                        good: '你的代码组织的很好，长一点没关系',
                        bad: '你的代码将混乱不堪，你自己都看不懂',
                        weekday: true,
                    },
                    {
                        name: '提交代码',
                        good: '遇到冲突的几率是最低的',
                        bad: '你遇到的一大堆冲突会让你觉得自己是不是时间穿越了',
                        weekday: true,
                    },
                    {
                        name: '代码复审',
                        good: '发现重要问题的几率大大增加',
                        bad: '你什么问题都发现不了，白白浪费时间',
                        weekday: true,
                    },
                    {
                        name: '开会',
                        good: '写代码之余放松一下打个盹，有益健康',
                        bad: '小心被扣屎盆子背黑锅',
                        weekday: true,
                    },
                    {
                        name: '打 DOTA',
                        good: '你将有如神助',
                        bad: '你会被虐的很惨',
                        weekday: true,
                        weekend: true,
                    },
                    {
                        name: '晚上上线',
                        good: '晚上是程序员精神最好的时候',
                        bad: '你白天已经筋疲力尽了',
                        weekday: true,
                    },
                    {
                        name: '修复 BUG',
                        good: '你今天对 BUG 的嗅觉大大提高',
                        bad: '新产生的 BUG 将比修复的更多',
                        weekday: true,
                    },
                    {
                        name: '设计评审',
                        good: '设计评审会议将变成头脑风暴',
                        bad: '人人筋疲力尽，评审就这么过了',
                        weekday: true,
                    },
                    {
                        name: '需求评审',
                        good: '',
                        bad: '',
                        weekday: true,
                    },
                    {
                        name: '上微博',
                        good: '今天发生的事不能错过',
                        bad: '今天的微博充满负能量',
                        weekday: true,
                        weekend: true,
                    },
                    {
                        name: '上 AB站',
                        good: '还需要理由吗？',
                        bad: '满屏兄贵亮瞎你的眼',
                        weekday: true,
                        weekend: true,
                    },
                    {
                        name: '玩 FlappyBird',
                        good: '今天破纪录的几率很高',
                        bad: '除非你想玩到把手机砸了',
                        weekday: true,
                        weekend: true,
                    },
                ],
                specials: [
                    {
                        name: '待在男（女）友身边',
                        bad: '脱团火葬场，入团保平安。',
                        date: 214,
                    },
                ],
                hints: [
                    '座位朝向：面向%directions%写程序，BUG 最少。',
                    '今日宜饮：%drinks%',
                    '女神亲近指数：%stars%',
                ],
            },
        ],
        lucks: [
            {
                creator: 0,
                owner: 0,
                id: 'coderluck',
                title: '程序员求签',
                random: 42,
                rates: [
                    {
                        name: '超大吉',
                        weight: 10,
                        description: '',
                    },
                    {
                        name: '大吉',
                        weight: 100,
                        description: '',
                    },
                    {
                        name: '吉',
                        weight: 500,
                        description: '',
                    },
                    {
                        name: '小吉',
                        weight: 800,
                        description: '',
                    },
                    {
                        name: '???',
                        weight: 300,
                        description: '',
                    },
                    {
                        name: '小凶',
                        weight: 800,
                        description: '',
                    },
                    {
                        name: '凶',
                        weight: 500,
                        description: '',
                    },
                    {
                        name: '大凶',
                        weight: 100,
                        description: '',
                    },
                    {
                        name: '超大凶',
                        weight: 10,
                        description: '',
                    },
                ],
            },
        ],
        suffix: {
            214: '❤',
            604: '🕯',
            817: '🐸🎂',
            1024: '🖥',
        },

        find: (list, key, value, found, notFound) => {
            for (const i in list) {
                if (typeof key === 'string') {
                    if (list[i][key] === value) {
                        return found(i, list[i]);
                    }
                } else if (list[i] === value) {
                    return found(i, list[i]);
                }
            }

            return notFound();
        },

        getCalender: (msg, calId) => {
            return self.find(self.calenders, 'id', calId, (i, calender) => {
                if (
                    calender.creator === msg.from.id
                    || calender.owner === msg.chat.id
                ) {
                    return calender;
                } else {
                    throw ActionError('请在创建 ' + calId + ' 的群内进行操作');
                }
            }, () => {
                throw ActionError('找不到 ' + calId);
            });
        },

        getDictionary: (calender, dictId) => {
            return self.find(calender.dictionaries, 'id', dictId, (i, dictionary) => {
                return dictionary;
            }, () => {
                // create new entry if not exist
                calender.dictionaries.push({
                    id: dictId,
                    random: Math.floor(Math.random() * 100) + 1,
                    items: [],
                });

                return calender.dictionaries[calender.dictionaries.length - 1];
            });
        },

        getLuck: (msg, luckId) => {
            return self.find(self.lucks, 'id', luckId, (i, luck) => {
                if (
                    luck.creator === msg.from.id
                    || luck.owner === msg.chat.id
                ) {
                    return luck;
                } else {
                    throw ActionError('请在创建 ' + luckId + ' 的群内进行操作');
                }
            }, () => {
                throw ActionError('找不到 ' + luckId);
            });
        },

        actionCalender: function (calId, title) {
            self.find(self.calenders, 'id', calId, (i, calender) => {
                if (calender.creator === this.from.id) {
                    // set title
                    calender.title = title;

                    return;
                } else {
                    throw ActionError(calId + ' 已被其它用户创建');
                }
            }, () => {
                let count = 0;

                for (const i in self.calenders) {
                    if (self.calenders[i].title && self.calenders[i].creator === this.from.id) {
                        count += 1;
                    }
                }

                if (count >= 3) {
                    throw ActionError('你创建了太多的黄历');
                }

                self.calenders.push({
                    creator: this.from.id,
                    owner: this.chat.id,
                    id: calId,
                    title: title,
                    dictionaries: [],
                    activities: [],
                    specials: [],
                    hints: [],
                });
            });
        },

        actionDisableCalender: function (calId) {
            const calender = self.getCalender(this, calId);

            if (calender.creator === this.from.id) {
                calender.title = '';
            } else {
                throw ActionError('只有 ' + calId + ' 的创建者可以进行此操作');
            }
        },

        actionDictionaryPick: function (calId, dictId, pick) {
            const calender = self.getCalender(this, calId);
            const dictionary = self.getDictionary(calender, dictId);

            delete dictionary.random;
            dictionary.pick = pick;
        },

        actionDictionaryRandom: function (calId, dictId, random) {
            const calender = self.getCalender(this, calId);
            const dictionary = self.getDictionary(calender, dictId);

            dictionary.random = random;
            delete dictionary.pick;
        },

        actionItem: function (calId, dictId, item) {
            const calender = self.getCalender(this, calId);
            const dictionary = self.getDictionary(calender, dictId);

            self.find(dictionary.items, null, item, (i, text) => {
                // nothing
            }, () => {
                dictionary.items.push(item);
            });
        },

        actionDeleteItem: function (calId, dictId, item) {
            const calender = self.getCalender(this, calId);
            const dictionary = self.getDictionary(calender, dictId);

            self.find(dictionary.items, null, item, (i, text) => {
                dictionary.items.splice(i, 1);
            }, () => {
                // nothing
            });
        },

        actionActivityWeekday: function (calId, name, good, bad) {
            const calender = self.getCalender(this, calId);

            self.find(calender.activities, 'name', name, (i, activity) => {
                activity.good = good;
                activity.bad = bad;
                activity.weekday = true;
                delete activity.weekend;
            }, () => {
                calender.activities.push({
                    name: name,
                    good: good,
                    bad: bad,
                    weekday: true,
                });
            });
        },

        actionActivityWeekend: function (calId, name, good, bad) {
            const calender = self.getCalender(this, calId);

            self.find(calender.activities, 'name', name, (i, activity) => {
                activity.good = good;
                activity.bad = bad;
                delete activity.weekday;
                activity.weekend = true;
            }, () => {
                calender.activities.push({
                    name: name,
                    good: good,
                    bad: bad,
                    weekend: true,
                });
            });
        },

        actionActivity: function (calId, name, good, bad) {
            const calender = self.getCalender(this, calId);

            self.find(calender.activities, 'name', name, (i, activity) => {
                activity.good = good;
                activity.bad = bad;
                activity.weekday = true;
                activity.weekend = true;
            }, () => {
                calender.activities.push({
                    name: name,
                    good: good,
                    bad: bad,
                    weekday: true,
                    weekend: true,
                });
            });
        },

        actionDeleteActivity: function (calId, name) {
            const calender = self.getCalender(this, calId);

            self.find(calender.activities, 'name', name, (i, activity) => {
                calender.activities.splice(i, 1);
            }, () => {
                // nothing
            });
        },

        actionSpecialGood: function (calId, name, good, date) {
            const calender = self.getCalender(this, calId);

            self.find(calender.specials, 'name', name, (i, special) => {
                special.good = good;
                delete special.bad;
                special.date = date;
            }, () => {
                calender.specials.push({
                    name: name,
                    good: good,
                    date: date,
                });
            });
        },

        actionSpecialBad: function (calId, name, bad, date) {
            const calender = self.getCalender(this, calId);

            self.find(calender.specials, 'name', name, (i, special) => {
                delete special.good;
                special.bad = bad;
                special.date = date;
            }, () => {
                calender.specials.push({
                    name: name,
                    bad: bad,
                    date: date,
                });
            });
        },

        actionDeleteSpecial: function (calId, name) {
            const calender = self.getCalender(this, calId);

            self.find(calender.specials, 'name', name, (i, special) => {
                calender.specials.splice(i, 1);
            }, () => {
                // nothing
            });
        },

        actionHint: function (calId, hint) {
            const calender = self.getCalender(this, calId);

            self.find(calender.hints, null, hint, (i, text) => {
                // nothing
            }, () => {
                calender.hints.push(hint);
            });
        },

        actionDeleteHint: function (calId, hint) {
            const calender = self.getCalender(this, calId);

            self.find(calender.hints, null, hint, (i, text) => {
                calender.hints.splice(i, 1);
            }, () => {
                // nothing
            });
        },

        actionLuck: function (luckId, title, random) {
            self.find(self.lucks, 'id', luckId, (i, luck) => {
                if (luck.creator === this.from.id) {
                    // set title
                    luck.title = title;

                    return;
                } else {
                    throw ActionError(luckId + ' 已被其它用户创建');
                }
            }, () => {
                let count = 0;

                for (const i in self.lucks) {
                    if (self.lucks[i].title && self.lucks[i].creator === this.from.id) {
                        count += 1;
                    }
                }

                if (count >= 1) {
                    throw ActionError('你创建了太多的求签');
                }

                self.lucks.push({
                    creator: this.from.id,
                    owner: this.chat.id,
                    id: luckId,
                    title: title,
                    random: random,
                    rates: [],
                });
            });
        },

        actionDisableLuck: function (luckId) {
            const luck = self.getLuck(this, luckId);

            if (luck.creator === this.from.id) {
                luck.title = '';
            } else {
                throw ActionError('只有 ' + luckId + ' 的创建者可以进行此操作');
            }
        },

        actionRate: function (luckId, name, weight, description) {
            const luck = self.getLuck(this, luckId);

            self.find(luck.rates, 'name', name, (i, rate) => {
                rate.weight = weight;
                rate.description = description;
            }, () => {
                luck.rates.push({
                    name: name,
                    weight: weight,
                    description: description,
                });
            });
        },

        actionDeleteRate: function (luckId, name) {
            const luck = self.getLuck(this, luckId);

            self.find(luck.rates, 'name', name, (i, rate) => {
                luck.rates.splice(i, 1);
            }, () => {
                // nothing
            });
        },

        writeCalAction: (action, msg, args) => {
            try {
                self['action' + action].apply(msg, args);

                fs.write(fdCals, JSON.stringify({
                    action: action,
                    msg: msg,
                    args: args,
                }) + '\n', () => {
                    // nothing
                });

                return '操作成功';
            } catch (err) {
                if (err instanceof ActionError) {
                    return err.info;
                }
            }
        },

        loadCalActions: () => {
            readline.createInterface({
                input: fs.createReadStream(pathCals),
            }).on('line', (line) => {
                try {
                    const obj = JSON.parse(line);

                    self['action' + obj.action].apply(obj.msg, obj.args);
                } catch (err) {
                    console.error(err);
                }
            });
        },
    };

    return self;
};
