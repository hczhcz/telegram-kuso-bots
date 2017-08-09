'use strict';

const crc32 = require('crc-32');

const config = require('./config');
const bot = require('./bot.' + config.bot)(config.coderCalToken);

const weeks = ['日', '一', '二', '三', '四', '五', '六'];

const activities = [
    {name: '写单元测试', good: '写单元测试将减少出错', bad: '写单元测试会降低你的开发效率'},
    {name: '洗澡', good: '你几天没洗澡了？', bad: '会把设计方面的灵感洗掉', weekend: true},
    {name: '锻炼一下身体', good: '', bad: '能量没消耗多少，吃得却更多', weekend: true},
    {name: '抽烟', good: '抽烟有利于提神，增加思维敏捷', bad: '除非你活够了，死得早点没关系', weekend: true},
    {name: '白天上线', good: '今天白天上线是安全的', bad: '可能导致灾难性后果'},
    {name: '重构', good: '代码质量得到提高', bad: '你很有可能会陷入泥潭'},
    {name: '使用%tools%', good: '你看起来更有品位', bad: '别人会觉得你在装逼'},
    {name: '跳槽', good: '该放手时就放手', bad: '鉴于当前的经济形势，你的下一份工作未必比现在强'},
    {name: '招人', good: '你面前这位有成为牛人的潜质', bad: '这人会写程序吗？'},
    {name: '面试', good: '面试官今天心情很好', bad: '面试官不爽，会拿你出气'},
    {name: '提交辞职申请', good: '公司找到了一个比你更能干更便宜的家伙，巴不得你赶快滚蛋', bad: '鉴于当前的经济形势，你的下一份工作未必比现在强'},
    {name: '申请加薪', good: '老板今天心情很好', bad: '公司正在考虑裁员'},
    {name: '晚上加班', good: '晚上是程序员精神最好的时候', bad: '', weekend: true},
    {name: '在妹子面前吹牛', good: '改善你矮穷挫的形象', bad: '会被识破', weekend: true},
    {name: '撸管', good: '避免缓冲区溢出', bad: '强撸灰飞烟灭', weekend: true},
    {name: '浏览成人网站', good: '重拾对生活的信心', bad: '你会心神不宁', weekend: true},
    {name: '命名变量\'%vars%\'', good: '', bad: ''},
    {name: '写超过%lengths%行的方法', good: '你的代码组织的很好，长一点没关系', bad: '你的代码将混乱不堪，你自己都看不懂'},
    {name: '提交代码', good: '遇到冲突的几率是最低的', bad: '你遇到的一大堆冲突会让你觉得自己是不是时间穿越了'},
    {name: '代码复审', good: '发现重要问题的几率大大增加', bad: '你什么问题都发现不了，白白浪费时间'},
    {name: '开会', good: '写代码之余放松一下打个盹，有益健康', bad: '小心被扣屎盆子背黑锅'},
    {name: '打DOTA', good: '你将有如神助', bad: '你会被虐的很惨', weekend: true},
    {name: '晚上上线', good: '晚上是程序员精神最好的时候', bad: '你白天已经筋疲力尽了'},
    {name: '修复BUG', good: '你今天对BUG的嗅觉大大提高', bad: '新产生的BUG将比修复的更多'},
    {name: '设计评审', good: '设计评审会议将变成头脑风暴', bad: '人人筋疲力尽，评审就这么过了'},
    {name: '需求评审', good: '', bad: ''},
    {name: '上微博', good: '今天发生的事不能错过', bad: '今天的微博充满负能量', weekend: true},
    {name: '上AB站', good: '还需要理由吗？', bad: '满屏兄贵亮瞎你的眼', weekend: true},
    {name: '玩FlappyBird', good: '今天破纪录的几率很高', bad: '除非你想玩到把手机砸了', weekend: true},
];
const specials = [
    {date: 20140214, name: '待在男（女）友身边', bad: '脱团火葬场，入团保平安。'},
];
const components = [
    {name: 'vars', random: 12, list: ['jieguo', 'huodong', 'pay', 'expire', 'zhangdan', 'every', 'free', 'i1', 'a', 'virtual', 'ad', 'spider', 'mima', 'pass', 'ui']},
    {name: 'tools', random: 11, list: ['Eclipse写程序', 'MSOffice写文档', '记事本写程序', 'Windows8', 'Linux', 'MacOS', 'IE', 'Android设备', 'iOS设备']},
    {name: 'lengths', random: 12, list: [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276]},
    {name: 'directions', random: 2, list: ['北方', '东北方', '东方', '东南方', '南方', '西南方', '西方', '西北方']},
    {name: 'drinks', pick: 2, list: ['水', '茶', '红茶', '绿茶', '咖啡', '奶茶', '可乐', '鲜奶', '豆奶', '果汁', '果味汽水', '苏打水', '运动饮料', '酸奶', '酒']},
    {name: 'stars', random: 6, list: ['★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★']},
];

const lucks = [
    {name: '超大吉', rate: 10, description: ''},
    {name: '大吉', rate: 100, description: ''},
    {name: '吉', rate: 500, description: ''},
    {name: '小吉', rate: 800, description: ''},
    {name: '???', rate: 300, description: ''},
    {name: '小凶', rate: 800, description: ''},
    {name: '凶', rate: 500, description: ''},
    {name: '大凶', rate: 100, description: ''},
    {name: '超大凶', rate: 10, description: ''},
];

process.on('uncaughtException', (err) => {
    console.error(err);
});

const getCST = () => {
    return new Date(Date.now() + 8 * 3600 * 1000);
};

const isWeekend = () => {
    const today = getCST();

    return today.getUTCDay() === 0 || today.getUTCDay() === 6;
};

const isSomeday = () => {
    const today = getCST();

    return today.getUTCMonth() === 5 && today.getUTCDate() === 4;
};

const getTodayInt = () => {
    const today = getCST();

    return today.getUTCFullYear() * 10000
        + (today.getUTCMonth() + 1) * 100
        + today.getUTCDate();
};

const getTodayString = () => {
    const today = getCST();

    return '今天是' + today.getUTCFullYear() + '年'
        + (today.getUTCMonth() + 1) + '月'
        + today.getUTCDate() + '日'
        + ' 星期' + weeks[today.getUTCDay()];
};

const seedRandom = (seed, iter) => {
    let result = seed;

    for (let i = 0; i < 100 + iter; i += 1) {
        result *= result;
        result %= 11117;
    }

    return result;
};

const random = (iter) => {
    return seedRandom(getTodayInt() % 11117, iter);
};

const pickRandom = (data, size) => {
    const result = data.slice();

    for (let i = 0; i < data.length - size; i += 1) {
        result.splice(random(i) % result.length, 1);
    }

    return result;
};

const pickComponent = (name) => {
    for (const i in components) {
        if (components[i].name === name) {
            if (components[i].random) {
                return components[i].list[
                    random(components[i].random) % components[i].list.length
                ];
            } else if (components[i].pick) {
                return pickRandom(components[i].list, components[i].pick).join('，');
            } else {
                // never reach
                throw Error();
            }
        }
    }

    return '';
};

const pickActivities = (size) => {
    if (isWeekend()) {
        const todayActivities = [];

        for (const i in activities) {
            if (activities[i].weekend) {
                todayActivities.push(activities[i]);
            }
        }

        return pickRandom(todayActivities, size);
    } else {
        return pickRandom(activities, size);
    }
};

const pickSpecials = () => {
    const todaySpecials = [];

    const date = getTodayInt();

    for (const i in specials) {
        if (specials[i].date === date) {
            todaySpecials.push(specials[i]);
        }
    }

    return todaySpecials;
};

const parse = (event, key) => {
    const sections = event[key].split('%');

    let description = '';

    for (const i in sections) {
        if (i % 2) {
            description += pickComponent(sections[i]);
        } else {
            description += sections[i];
        }
    }

    return {
        name: event.name,
        description: description,
    };
};

const pickEvents = () => {
    const good = [];
    const bad = [];

    const numGood = random(98) % 3 + 2;
    const numBad = random(87) % 3 + 2;

    const pickedActivities = pickActivities(numGood + numBad);

    for (const i in pickedActivities) {
        if (i < numGood) {
            good.push(parse(pickedActivities[i], 'good'));
        } else {
            bad.push(parse(pickedActivities[i], 'bad'));
        }
    }

    const pickedSpecials = pickSpecials();

    for (const i in pickedSpecials) {
        if (pickedSpecials[i].good) {
            good.push(parse(pickedSpecials[i], 'good'));
        } else {
            bad.push(parse(pickedSpecials[i], 'bad'));
        }
    }

    return {
        good: good,
        bad: bad,
    };
};

const pickLuck = (query) => {
    let range = 0;

    for (const i in lucks) {
        range += lucks[i].rate;
    }

    const target = seedRandom(
        crc32.str(query.query) ^ query.from.id, 42
    ) % range;
    let sum = 0;

    for (const i in lucks) {
        sum += lucks[i].rate;

        if (sum > target) {
            return lucks[i];
        }
    }

    // never reach
    throw Error();
};

bot.on('inline_query', (query) => {
    if (query.query) {
        const pickedLuck = pickLuck(query);

        let luckText = '程序员求签\n' + getTodayString()
            + '\n\n所求事项：' + query.query
            + '\n结果：' + pickedLuck.name;

        if (pickedLuck.description) {
            luckText += ' - ' + pickedLuck.description;
        }

        return bot.answerInlineQuery(query.id, [{
            type: 'article',
            id: 'CODERLUCK',
            title: isSomeday()
                ? '程序员求签🕯'
                : query.query === 'hczhcz'
                ? '程序员求签🌝'
                : '程序员求签',
            input_message_content: {
                message_text: luckText,
            },
        }], {
            cache_time: 0,
            is_personal: true,
        });
    } else {
        const pickedEvents = pickEvents();

        let calText = '程序员老黄历\n' + getTodayString() + '\n\n宜：';

        for (const i in pickedEvents.good) {
            calText += '\n' + pickedEvents.good[i].name;

            if (pickedEvents.good[i].description) {
                calText += ' - ' + pickedEvents.good[i].description;
            }
        }

        calText += '\n\n不宜：';

        for (const i in pickedEvents.bad) {
            calText += '\n' + pickedEvents.bad[i].name;

            if (pickedEvents.bad[i].description) {
                calText += ' - ' + pickedEvents.bad[i].description;
            }
        }

        calText += '\n\n座位朝向：面向' + pickComponent('directions') + '写程序，BUG 最少。'
            + '\n今日宜饮：' + pickComponent('drinks')
            + '\n女神亲近指数：' + pickComponent('stars');

        return bot.answerInlineQuery(query.id, [{
            type: 'article',
            id: 'CODERCAL',
            title: isSomeday()
                ? '程序员老黄历🕯'
                : '程序员老黄历',
            input_message_content: {
                message_text: calText,
            },
        }], {
            cache_time: 0,
            is_personal: true,
        });
    }
});

bot.on('chosen_inline_result', (chosen) => {
    console.log('[' + Date() + '] ' + chosen.from.id + ' ' + chosen.query + ' ' + chosen.result_id);
});
