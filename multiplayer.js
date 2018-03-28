'use strict';

const config = require('./config');

const lists = {};

const get = (id) => {
    if (lists[id]) {
        const list = lists[id];

        return list[0];
    }

    return null;
};

const add = (id, player, onDone, onPlayerExist) => {
    const list = lists[id] = lists[id] || [];

    for (const i in list) {
        if (list[i].id === player.id) {
            return onPlayerExist();
        }
    }

    if (list.length < config.abMaxPlayer) {
        list.push(player);
    }

    return onDone(list);
};

const remove = (id, player, onDone, onPlayerNotExist) => {
    if (lists[id]) {
        const list = lists[id];

        for (const i in list) {
            if (list[i].id === player.id) {
                list.splice(i, 1);

                return onDone(list);
            }
        }
    }

    return onPlayerNotExist();
};

const clear = (id, onDone, onNotMultiplater) => {
    if (lists[id]) {
        delete lists[id];

        return onDone();
    }

    return onNotMultiplater();
};

const verify = (id, player, onValid, onNotValid) => {
    if (lists[id]) {
        const list = lists[id];

        if (!list.length) {
            return onValid();
        }

        if (list[0].id === player.id) {
            list.push(list.shift());

            return onValid();
        }

        return onNotValid();
    }

    return onValid();
};

module.exports = {
    get: get,
    add: add,
    remove: remove,
    clear: clear,
    verify: verify,
};
