'use strict';

const canvas = require('canvas');

const generate = (rows, columns, bgImage) => {
    if (rows > 100 || columns > 100) {
        return null;
    }

    const image = canvas.createCanvas(columns, rows);
    const ctx = image.getContext('2d');

    ctx.drawImage(bgImage, 0, 0, columns, rows);

    const data = ctx.getImageData(0, 0, columns, rows).data;

    const map = [];

    for (let i = 0; i < rows; i += 1) {
        map.push([]);

        for (let j = 0; j < columns; j += 1) {
            map[i].push(false);
        }
    }

    let min = 765;
    let max = -255;
    const bnow = [255, 255, 255, 0];
    const wnow = [0, 0, 0, 255];

    for (let i = 0; i < rows; i += 1) {
        for (let j = 0; j < columns; j += 1) {
            const offset = (i * columns + j) * 4;
            const depth = data[offset] + data[offset + 1] + data[offset + 2] - data[offset + 3];

            if (min > depth) {
                min = depth;
                bnow[0] = data[offset];
                bnow[1] = data[offset + 1];
                bnow[2] = data[offset + 2];
                bnow[3] = data[offset + 3];
            }

            if (max < depth) {
                max = depth;
                wnow[0] = data[offset];
                wnow[1] = data[offset + 1];
                wnow[2] = data[offset + 2];
                wnow[3] = data[offset + 3];
            }
        }
    }

    for (let iter = 0; iter < 10; iter += 1) {
        // k-means

        let bn = 0;
        let wn = 0;
        const bsum = [0, 0, 0, 0];
        const wsum = [0, 0, 0, 0];

        for (let i = 0; i < rows; i += 1) {
            for (let j = 0; j < columns; j += 1) {
                const offset = (i * columns + j) * 4;

                const bdistance = (data[offset] - bnow[0]) * (data[offset] - bnow[0])
                    + (data[offset + 1] - bnow[1]) * (data[offset + 1] - bnow[1])
                    + (data[offset + 2] - bnow[2]) * (data[offset + 2] - bnow[2])
                    + (data[offset + 3] - bnow[3]) * (data[offset + 3] - bnow[3]);
                const wdistance = (data[offset] - wnow[0]) * (data[offset] - wnow[0])
                    + (data[offset + 1] - wnow[1]) * (data[offset + 1] - wnow[1])
                    + (data[offset + 2] - wnow[2]) * (data[offset + 2] - wnow[2])
                    + (data[offset + 3] - wnow[3]) * (data[offset + 3] - wnow[3]);

                map[i][j] = bdistance >= wdistance;

                if (map[i][j]) {
                    bn += 1;
                    bsum[0] += data[offset];
                    bsum[1] += data[offset + 1];
                    bsum[2] += data[offset + 2];
                    bsum[3] += data[offset + 3];
                } else {
                    wn += 1;
                    wsum[0] += data[offset];
                    wsum[1] += data[offset + 1];
                    wsum[2] += data[offset + 2];
                    wsum[3] += data[offset + 3];
                }
            }
        }

        if (bn > 0) {
            bnow[0] = bsum[0] / bn;
            bnow[1] = bsum[1] / bn;
            bnow[2] = bsum[2] / bn;
            bnow[3] = bsum[3] / bn;
        }

        if (wn > 0) {
            wnow[0] = wsum[0] / wn;
            wnow[1] = wsum[1] / wn;
            wnow[2] = wsum[2] / wn;
            wnow[3] = wsum[3] / wn;
        }
    }

    return map;
};

module.exports = {
    generate: generate,
};
