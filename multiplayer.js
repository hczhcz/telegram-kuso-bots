'use strict';

const config = require('./config');

module.exports = () => {
    const self = {
        time: {},
        lists: {},

        get: (id) => {
            if (self.lists[id]) {
                const time = Date.now();

                if (time - self.time[id] > config.multiplayerTimeout) {
                    delete self.time[id];
                    delete self.lists[id];

                    return null;
                }

                self.time[id] = time;

                const list = self.lists[id];

                return list[0];
            }

            return null;
        },

        getRandom: (id) => {
            if (self.lists[id]) {
                const time = Date.now();

                if (time - self.time[id] > config.multiplayerTimeout) {
                    delete self.time[id];
                    delete self.lists[id];

                    return null;
                }

                self.time[id] = time;

                const list = self.lists[id];

                return list[Math.floor(Math.random() * list.length)];
            }

            return null;
        },

        add: (id, player, onDone, onPlayerExist, onListFull) => {
            const time = Date.now();

            self.time[id] = time;

            if (!self.lists[id]) {
                self.lists[id] = [];
            }

            const list = self.lists[id];

            for (let i = 0; i < list.length; i += 1) {
                if (list[i].id === player.id) {
                    return onPlayerExist(list);
                }
            }

            if (list.length < config.multiplayerMaxPlayer) {
                list.push(player);
            } else {
                return onListFull(list);
            }

            return onDone(list);
        },

        remove: (id, player, onDone, onPlayerNotExist) => {
            if (self.lists[id]) {
                const time = Date.now();

                self.time[id] = time;

                const list = self.lists[id];

                for (let i = 0; i < list.length; i += 1) {
                    if (list[i].id === player.id) {
                        list.splice(i, 1);

                        if (!list.length) {
                            delete self.time[id];
                            delete self.lists[id];
                        }

                        return onDone(list);
                    }
                }
            }

            return onPlayerNotExist();
        },

        clear: (id, onDone, onNotMultiplayer) => {
            if (self.lists[id]) {
                delete self.time[id];
                delete self.lists[id];

                return onDone();
            }

            return onNotMultiplayer();
        },

        verify: (id, player, onValid, onNotValid) => {
            if (self.lists[id]) {
                const time = Date.now();

                if (time - self.time[id] > config.multiplayerTimeout) {
                    delete self.time[id];
                    delete self.lists[id];

                    return onValid();
                }

                self.time[id] = time;

                const list = self.lists[id];

                if (list.length <= 1) {
                    return onValid();
                }

                if (list[0].id === player.id) {
                    list.push(list.shift());

                    return onValid();
                }

                return onNotValid();
            }

            return onValid();
        },
    };

    return self;
};
