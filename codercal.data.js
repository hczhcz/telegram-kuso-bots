'use strict';

const fs = require('fs');
const readline = require('readline');

const preset = require('./codercal.preset');

module.exports = (pathCals) => {
    const fdCals = fs.openSync(pathCals, 'a');

    const ActionError = function (info) {
        this.info = info;
    };

    ActionError.prototype = new Error();

    const self = {
        calenders: preset.calenders,
        lucks: preset.lucks,
        suffix: preset.suffix,

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
                }

                throw new ActionError('请在创建 ' + calId + ' 的群内进行操作');
            }, () => {
                throw new ActionError('找不到 ' + calId);
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
                }

                throw new ActionError('请在创建 ' + luckId + ' 的群内进行操作');
            }, () => {
                throw new ActionError('找不到 ' + luckId);
            });
        },

        actionCalender: function (calId, title) {
            self.find(self.calenders, 'id', calId, (i, calender) => {
                if (calender.creator === this.from.id) {
                    // set title
                    calender.title = title;

                    return;
                }

                throw new ActionError(calId + ' 已被其它用户创建');
            }, () => {
                let count = 0;

                for (const i in self.calenders) {
                    if (self.calenders[i].title && self.calenders[i].creator === this.from.id) {
                        count += 1;
                    }
                }

                if (count >= 3) {
                    throw new ActionError('你创建了太多的黄历');
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
                throw new ActionError('只有 ' + calId + ' 的创建者可以进行此操作');
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
                }

                throw new ActionError(luckId + ' 已被其它用户创建');
            }, () => {
                let count = 0;

                for (const i in self.lucks) {
                    if (self.lucks[i].title && self.lucks[i].creator === this.from.id) {
                        count += 1;
                    }
                }

                if (count >= 1) {
                    throw new ActionError('你创建了太多的求签');
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
                throw new ActionError('只有 ' + luckId + ' 的创建者可以进行此操作');
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
                Reflect.apply(self['action' + action], msg, args);

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
                const obj = JSON.parse(line);

                Reflect.apply(self['action' + obj.action], obj.msg, obj.args);
            });
        },
    };

    return self;
};
