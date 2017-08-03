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
    {name: '使用%t', good: '你看起来更有品位', bad: '别人会觉得你在装逼'},
    {name: '跳槽', good: '该放手时就放手', bad: '鉴于当前的经济形势，你的下一份工作未必比现在强'},
    {name: '招人', good: '你面前这位有成为牛人的潜质', bad: '这人会写程序吗？'},
    {name: '面试', good: '面试官今天心情很好', bad: '面试官不爽，会拿你出气'},
    {name: '提交辞职申请', good: '公司找到了一个比你更能干更便宜的家伙，巴不得你赶快滚蛋', bad: '鉴于当前的经济形势，你的下一份工作未必比现在强'},
    {name: '申请加薪', good: '老板今天心情很好', bad: '公司正在考虑裁员'},
    {name: '晚上加班', good: '晚上是程序员精神最好的时候', bad: '', weekend: true},
    {name: '在妹子面前吹牛', good: '改善你矮穷挫的形象', bad: '会被识破', weekend: true},
    {name: '撸管', good: '避免缓冲区溢出', bad: '强撸灰飞烟灭', weekend: true},
    {name: '浏览成人网站', good: '重拾对生活的信心', bad: '你会心神不宁', weekend: true},
    {name: '命名变量\'%v\'', good: '', bad: ''},
    {name: '写超过%l行的方法', good: '你的代码组织的很好，长一点没关系', bad: '你的代码将混乱不堪，你自己都看不懂'},
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
const vars = ['jieguo', 'huodong', 'pay', 'expire', 'zhangdan', 'every', 'free', 'i1', 'a', 'virtual', 'ad', 'spider', 'mima', 'pass', 'ui'];
const tools = ['Eclipse写程序', 'MSOffice写文档', '记事本写程序', 'Windows8', 'Linux', 'MacOS', 'IE', 'Android设备', 'iOS设备'];
const directions = ['北方', '东北方', '东方', '东南方', '南方', '西南方', '西方', '西北方'];
const drinks = ['水', '茶', '红茶', '绿茶', '咖啡', '奶茶', '可乐', '鲜奶', '豆奶', '果汁', '果味汽水', '苏打水', '运动饮料', '酸奶', '酒'];

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
const lucksRateSum = 3120;

const isWeekend = () => {
    const today = new Date();

    return today.getDay() === 0 || today.getDay() === 6;
};

const isSomeday = () => {
    const today = new Date();

    return today.getMonth() === 5 && today.getDate() === 4;
};

const getTodayInt = () => {
    const today = new Date();

    return today.getFullYear() * 10000
        + (today.getMonth() + 1) * 100
        + today.getDate();
};

const getTodayString = () => {
    const today = new Date();

    return '今天是' + today.getFullYear() + '年'
        + (today.getMonth() + 1) + '月'
        + today.getDate() + '日'
        + ' 星期' + weeks[today.getDay()];
};

const getStarString = (num) => {
    let result = '';

    for (let i = 0; i < 5; ++i) {
        if (i < num) {
            result += '★';
        } else {
            result += '☆';
        }
    }

    return result;
};

const seedRandom = (seed, iter) => {
    let n = seed;

    for (let i = 0; i < 100 + iter; ++i) {
        n *= n;
        n %= 11117;
    }

    return n;
};

const random = (iter) => {
    return seedRandom(getTodayInt() % 11117, iter);
};

const pickRandom = (data, size) => {
    const result = data.slice();

    for (let i = 0; i < data.length - size; ++i) {
        result.splice(random(i) % result.length, 1);
    }

    return result;
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
    let description = event[key];

    if (description.indexOf('%v') >= 0) {
        description = description.replace('%v', vars[random(12) % vars.length]);
    }

    if (description.indexOf('%t') >= 0) {
        description = description.replace('%t', tools[random(11) % tools.length]);
    }

    if (description.indexOf('%l') >= 0) {
        description = description.replace('%l', (random(12) % 247 + 30).toString());
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
    const target = seedRandom(crc32.str(query), 42) % lucksRateSum;
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
    const pickedEvents = pickEvents();

    let calText = getTodayString() + '\n\n宜：\n';

    for (const i in pickedEvents.good) {
        calText += pickedEvents.good[i].name + ' - '
            + pickedEvents.good[i].description + '\n';
    }

    calText += '\n不宜：\n';

    for (const i in pickedEvents.bad) {
        calText += pickedEvents.bad[i].name + ' - '
            + pickedEvents.bad[i].description + '\n';
    }

    calText += '\n座位朝向：面向' + directions[random(2) % directions.length] + '写程序，BUG 最少。\n'
        + '今日宜饮：' + pickRandom(drinks, 2).join('，') + '\n'
        + '女神亲近指数：' + getStarString(random(6) % 5 + 1);

    const pickedLuck = pickLuck(query.query);

    const luckText = getTodayString() + '\n\n所求事项：\n' + query.query
        + '\n\n结果：\n' + pickedLuck.name + '\n' + pickedLuck.description;

    return bot.answerInlineQuery(query.id, [{
        type: 'article',
        id: 'CODERCAL',
        title: '程序员老黄历',
        input_message_content: {
            message_text: calText,
        },
    }, {
        type: 'article',
        id: 'CODERLUCK',
        title: '程序员求签',
        input_message_content: {
            message_text: luckText,
        },
    }], {
        cache_time: 0,
        is_personal: true,
    });
});

bot.on('chosen_inline_result', (chosen) => {
    console.log(chosen);
});
