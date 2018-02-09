'use strict';

const config = require('./config');

const lists = {};

const add = (id, player) => {
    const list = lists[id] = lists[id] || [];
    const i = list.indexOf(player);

    if (i < 0 && list.length < config.abMaxPlayer) {
        list.push(player);
    }

    return list;
};

const remove = (id, player) => {
    const list = lists[id] = lists[id] || [];
    const i = list.indexOf(player);

    if (i >= 0) {
        list.splice(i, 1);
    }

    return list;
};

const clear = (id) => {
    delete lists[id];
};

const verify = (id, player, onValid, onNotValid) => {
    const list = lists[id] = lists[id] || [];

    if (!list.length) {
        return onValid();
    }

    if (list[0].id === player.id) {
        list.push(list.shift());

        return onValid();
    }

    return onNotValid();
};

module.exports = {
    add: add,
    remove: remove,
    clear: clear,
    verify: verify,
};
