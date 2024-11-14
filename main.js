const process = require('node:process');

const box = [
    [8, 0, 5, 3, 3, 3, 7],
    [5, 0, -1, -1, 0, 3, 1],
    [7, 0, 7, 0, 0, 0, 4],
    [0, 8, 3, 6, 5, 0, 3],
    [0, 9, 9, 2, 6, 4, 1],
    [9, 9, 0, 0, 4, 6, -1]];


const nReels = 7;
const nRows = 6;

// Direction vectors for BFS
const dRow = [-1, 0, 1, 0 ];
const dCol = [0, 1, 0, -1 ];

main();

function main() {

    const {counts, checked} = analyseBox(box);
    const sortedCounts = Array.from(counts).sort((a, b) => a[1] - b[1]).reverse();

    let checkedCopy = checked.map(function (arr) {
        return arr.slice();
    });
    const startPositions = [];
    BFS(box, checkedCopy, 2, 3, startPositions, nReels * nRows);

    let isAllPlaced = false;
    const checkedStartPositions = [];
    let startPosition = getNextPosition(null, checkedStartPositions, startPositions);
    const newBox = Array.from(Array(nRows), () => Array(nReels).fill(-1));

    while (!isAllPlaced && Object.keys(startPosition).length !== 0) {

        const checkedCopy = checked.map(function (arr) {
            return arr.slice();
        });

        isAllPlaced = checkStartPoint(startPosition, sortedCounts, box, newBox, checkedCopy);
        startPosition = getNextPosition(null, checkedStartPositions, startPositions);
    }

    console.log('Box');
    printBox(box);
    console.log('\nNew Box');
    printBox(newBox);

}

function analyseBox(box) {

    const counts = new Map();
    const checked = Array.from(Array(nRows), () => Array(nReels).fill(false));

    box.forEach((row, i) => {
        row.forEach((el, k) => {
            if(el >= 0) {
                if(counts.has(el)) {
                    let amount = counts.get(el);
                    counts.set(el, amount + 1);
                }
                else {
                    counts.set(el, 1);
                }
            }
            else {
                checked[i][k] = true;
            }
        });
    });

    return {counts : counts, checked : checked};
}

function checkStartPoint(startPoint, counts, box, newBox, checked) {

    let isAllPlaced = true;

    let checkedCopy = checked.map(function(arr) {
        return arr.slice();
    });
    const checkOrder = [];
    BFS(box, checkedCopy, startPoint.row, startPoint.reel, checkOrder, nReels * nRows);

    for (let i = 0; i < counts.length; i++) {

        const checkedPos = [];
        let nextPos = getNextPosition(checked, checkedPos, checkOrder);

        let places;
        let isPlaced = false;
        while (!isPlaced && Object.keys(nextPos).length !== 0) {
            places = [];
            checkedCopy = checked.map(function (arr) {
                return arr.slice();
            });

            isPlaced = BFS(box, checkedCopy, nextPos.row, nextPos.reel, places, counts[i][1]);
            nextPos = getNextPosition(checked, checkedPos, checkOrder);
        }

        isAllPlaced &= isPlaced;

        places.forEach(pos => {
            newBox[pos.row][pos.reel] = counts[i][0];
            checked[pos.row][pos.reel] = true;
        });

    }

    return isAllPlaced;
}

function getNextPosition(checked, checkedPos, checkOrder) {
    for(let i = 0; i < checkOrder.length; i++) {
        const pos = checkOrder[i];
        if((!checked || (checked && !checked[pos.row][pos.reel])) && !checkedPos.includes(pos)) {
            checkedPos.push(pos);
            return pos;
        }
    }

    return {};
}

function isValid(checked, row, col)  {
    // If cell lies out of bounds
    if (row < 0 || col < 0
        || row >= nRows || col >= nReels)
        return false;

    // If cell is already visited
    if (checked[row][col])
        return false;

    // Otherwise
    return true;
}

function BFS(grid, checked,row, col, places, maxN) {
    // Stores indices of the matrix cells
    const q = [];

    let checkedN = 0;

    // Mark the starting cell as visited and push it into the queue
    q.push([row, col]);
    checked[row][col] = true;

    // Iterate while the queue is not empty
    while (q.length !== 0) {

        const cell = q[0];
        const x = cell[0];
        const y = cell[1];

        places.push({row : x, reel : y});

        q.shift();

        checkedN++;

        // Go to the adjacent cells
        for (let i = 0; i < 4; i++) {

            const adjx = x + dRow[i];
            const adjy = y + dCol[i];

            if (isValid(checked, adjx, adjy)) {
                q.push([adjx, adjy ]);
                checked[adjx][adjy] = true;
            }

            if(checkedN === maxN) {
                return true;
            }
        }
    }

    return false;

}

function printBox(box) {
    for(let i = 0; i < box.length; i++) {
        for(let k = 0; k < box[i].length; k++) {
            process.stdout.write(box[i][k] + ' ');
        }
        process.stdout.write('\n');
    }
}

console.log();