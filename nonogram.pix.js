'use strict';

const canvas = require('canvas');

const generate = (rows, columns, bgImage) => {
    if (rows > 100 || columns > 100) {
        return null;
    }

    const image = canvas.createCanvas(columns, rows);
    const ctx = image.getContext('2d');

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, columns, rows);
    ctx.drawImage(bgImage, 0, 0, columns, rows);

    const data = ctx.getImageData(0, 0, columns, rows).data;

    const map = [];

    for (let i = 0; i < rows; i += 1) {
        map.push([]);

        for (let j = 0; j < columns; j += 1) {
            map[i].push(false);
        }
    }

    let min = 3 * 255;
    let max = 0;
    const bnow = [255, 255, 255];
    const wnow = [0, 0, 0];

    for (let i = 0; i < rows; i += 1) {
        for (let j = 0; j < columns; j += 1) {
            const offset = (i * columns + j) * 4;
            const depth = data[offset] + data[offset + 1] + data[offset + 2];

            if (min > depth) {
                min = depth;
                bnow[0] = data[offset];
                bnow[1] = data[offset + 1];
                bnow[2] = data[offset + 2];
            }

            if (max < depth) {
                max = depth;
                wnow[0] = data[offset];
                wnow[1] = data[offset + 1];
                wnow[2] = data[offset + 2];
            }
        }
    }

    for (let iter = 0; iter < 10; iter += 1) {
        // k-means

        let bn = 0;
        let wn = 0;
        const bsum = [0, 0, 0];
        const wsum = [0, 0, 0];

        for (let i = 0; i < rows; i += 1) {
            for (let j = 0; j < columns; j += 1) {
                const offset = (i * columns + j) * 4;

                const bdistance = (data[offset] - bnow[0]) * (data[offset] - bnow[0])
                    + (data[offset + 1] - bnow[1]) * (data[offset + 1] - bnow[1])
                    + (data[offset + 2] - bnow[2]) * (data[offset + 2] - bnow[2]);
                const wdistance = (data[offset] - wnow[0]) * (data[offset] - wnow[0])
                    + (data[offset + 1] - wnow[1]) * (data[offset + 1] - wnow[1])
                    + (data[offset + 2] - wnow[2]) * (data[offset + 2] - wnow[2]);

                map[i][j] = bdistance >= wdistance;

                if (map[i][j]) {
                    bn += 1;
                    bsum[0] += data[offset];
                    bsum[1] += data[offset + 1];
                    bsum[2] += data[offset + 2];
                } else {
                    wn += 1;
                    wsum[0] += data[offset];
                    wsum[1] += data[offset + 1];
                    wsum[2] += data[offset + 2];
                }
            }
        }

        if (bn > 0) {
            bnow[0] = bsum[0] / bn;
            bnow[1] = bsum[1] / bn;
            bnow[2] = bsum[2] / bn;
        }

        if (wn > 0) {
            wnow[0] = wsum[0] / wn;
            wnow[1] = wsum[1] / wn;
            wnow[2] = wsum[2] / wn;
        }
    }

    return map;
};

module.exports = {
    generate: generate,
};
