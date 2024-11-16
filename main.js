const process = require('node:process');

const box = [
    [-1, -1, 5, 3, 3, 3, 0],
    [5, 0, -1, -1, 0, 3, 0],
    [-1, 0, -1, 0, 0, 0, -1],
    [0, 8, 3, -1, 5, 0, 3],
    [0, 9, 9, -1, 0, -1, 5],
    [9, 9, 0, 0, 5, 0, -1]];


const nReels = 7;
const nRows = 6;

// Direction vectors for BFS
const dRow = [-1, 0, 1, 0 ];
const dCol = [0, 1, 0, -1 ];

const threshold = 4;

main();

function main() {

    const {counts, checked} = analyseBox(box);
    const sortedCounts = Array.from(counts).sort((a, b) => a[1] - b[1]).reverse();

    const elementsToGroup = [];
    // const freeCounts = [];

    for(let i = 0; i < sortedCounts.length; i++) {
        if(sortedCounts[i][1] >= threshold) elementsToGroup.push(sortedCounts[i]);
        // else                                freeCounts.push(sortedCounts[i]);
    }

    const combinations = getPrioritizedCombinations(elementsToGroup);

    let {newBox, winCombination} = groupClusters(checked, elementsToGroup, combinations);

    const groupedElements = [];
    winCombination.forEach(id => {
        groupedElements.push(elementsToGroup[id][0]);
    })
    // placeElementsRandomly(box, newBox, freeCounts);
    newBox = fillEmptyPlaces(box, newBox, groupedElements)

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

function getPrioritizedCombinations(elementsToGroup) {

    const arr = [];
    for(let i = 0; i < elementsToGroup.length; i++) {
        arr.push([i]);
    }

    let combinations = getAllCombinations(arr, elementsToGroup.length);
    combinations = getUniqueCombinations(combinations);

    combinations = combinations.sort((a, b) => {
        return b.length - a.length;
    });

    combinations = combinations.sort((a, b) => {
        if(b.length === a.length) {
            return getCombinationCost(a) - getCombinationCost(b);
        }
    });

    return combinations;
}

function getAllCombinations(arr, depth) {
    if (depth === 1) {
        return arr;
    }
    else {
        let result = getAllCombinations(arr, depth - 1);
        result = result.flatMap((val) =>
            arr.map((char) => {
                if(val.includes(char[0]))  return null;
                else                    return [val, char].flat()

            })
        );

        result = result.filter((val) =>
            val !== null
        );

        return arr.concat(result);
    }
}

function getUniqueCombinations(result) {
    result = result.map(arr => arr.sort());

    for(let i = result.length - 1; i >= 0; i--) {
        for(let k = i - 1; k >= 0; k--) {
            if(result[i].length === result[k].length) {
                let isSimilar = true;
                for(let j = 0; j < result[i].length; j++) {
                    if(result[i][j] !== result[k][j]) {
                        isSimilar = false;
                    }
                }

                if(isSimilar) {
                    result.splice(i, 1);
                    i--;
                    k = i;
                }
            }
        }
    }

    return result;
}

function getCombinationCost(arr) {
    let cost = 0;
    arr.forEach(el => {
        cost += el;
    });

    return cost;
}

function groupClusters(checked, elementsToGroup, combinations) {

    let isAllPlaced = false;
    let combination = combinations.shift();
    let winCombination;
    let newBox;

    while(!isAllPlaced && combination) {

        winCombination = combination;

        let checkedCopy = checked.map(function (arr) {
            return arr.slice();
        });
        const startPositions = [];
        BFS(box, checkedCopy, 2, 3, startPositions, nReels * nRows);

        // const checkedStartPositions = [];
        let startPosition = startPositions.shift();

        while (!isAllPlaced && startPositions.length !== 0) {

            newBox = Array.from(Array(nRows), () => Array(nReels).fill(-1));
            const checkedCopy = checked.map(function (arr) {
                return arr.slice();
            });

            isAllPlaced = checkStartPoint(startPosition, elementsToGroup, box, newBox, checkedCopy, combination);
            startPosition = startPositions.shift();
        }


        combination = combinations.shift();
    }

    return {newBox : newBox, winCombination : winCombination};
}

function checkStartPoint(startPoint, counts, box, newBox, checked, combination) {

    let isAllPlaced = true;

    let checkedCopy = checked.map(function(arr) {
        return arr.slice();
    });
    const checkOrder = [];
    BFS(box, checkedCopy, startPoint.row, startPoint.reel, checkOrder, nReels * nRows);

    for (let i = 0; i < combination.length; i++) {

        const checkedPos = [];
        let nextPos = getNextPosition(checked, checkedPos, checkOrder);

        let places;
        let isPlaced = false;
        while (!isPlaced && Object.keys(nextPos).length !== 0) {
            places = [];
            checkedCopy = checked.map(function (arr) {
                return arr.slice();
            });

            isPlaced = BFS(box, checkedCopy, nextPos.row, nextPos.reel, places, counts[combination[i]][1]);
            nextPos = getNextPosition(checked, checkedPos, checkOrder);
        }

        isAllPlaced &= isPlaced;

        places.forEach(pos => {
            newBox[pos.row][pos.reel] = counts[combination[i]][0];
            checked[pos.row][pos.reel] = true;
        });

    }

    return isAllPlaced;
}

function getNextPosition(checked, checkedPos, checkOrder) {
    for(let i = 0; i < checkOrder.length; i++) {
        const pos = checkOrder[i];
        if(!checked[pos.row][pos.reel] && !checkedPos.includes(pos)) {
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
            if(box[i][k] === -1) {
                process.stdout.write('x ');
            }
            else {
                process.stdout.write(box[i][k] + ' ');
            }
        }
        process.stdout.write('\n');
    }
}

function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}

function placeElementsRandomly(box, newBox, counts) {

    const freePositions = getFreePositions(box, newBox);
    shuffle(freePositions);

    for(let i = 0; i < counts.length; i++) {
        for(let k = 0; k < counts[i][1]; k++) {
            const pos = freePositions.pop();
            newBox[pos.row][pos.reel] = counts[i][0];
        }
    }

}

function getFreePositions(box, newBox) {
    const freePositions = [];
    for(let i = 0; i < box.length; i++) {
        for(let k = 0; k < box[i].length; k++) {
            if(box[i][k] !== -1 && newBox[i][k] === -1) {
                freePositions.push({row : i, reel : k});
            }
        }
    }

    return freePositions;
}

function fillEmptyPlaces(box, newBox, groupedElements) {

    let newBoxChecked = newBox.map(function(arr) {
        return arr.slice();
    });

    const boxCopy = box.map(function(arr) {
        return arr.slice();
    });

    let isFirst = true;
    while(isFirst || !isCorrectBox(boxCopy, newBox, groupedElements)) {
        {
            isFirst = false;
            swapInBox(newBox, boxCopy, groupedElements, newBoxChecked);
        }

    }

    newBox = boxCopy.map(function(arr) {
        return arr.slice();
    });

    return newBox;
}

function swapInBox(newBox, boxCopy, groupedElements, newBoxChecked) {
    for (let i = 0; i < box.length; i++) {
        for (let k = 0; k < box[i].length; k++) {
            if (newBox[i][k] === -1 || (newBox[i][k] !== -1 && newBox[i][k] !== boxCopy[i][k])) {
                const boxEl = boxCopy[i][k];

                if (isInCluster(boxEl, groupedElements)) {
                    const {row, reel} = getPositionToSwap(boxEl, newBoxChecked);

                    let tmp = boxCopy[row][reel];
                    boxCopy[row][reel] = boxCopy[i][k];
                    boxCopy[i][k] = tmp;
                    newBoxChecked[row][reel] = -1;
                } else {
                    boxCopy[i][k] = boxEl;
                }
            }
            else if(newBox[i][k] === boxCopy[i][k]) {
                newBoxChecked[i][k] = -1;
            }
        }
    }
}

function isInCluster(el, counts) {
    for(let i = 0; i < counts.length; i++) {
        if(el === counts[i]) {
            return true;
        }
    }

    return false;
}

function getPositionToSwap(el, box) {
    for(let i = 0; i < box.length; i++) {
        for (let k = 0; k < box[i].length; k++) {
            if(el === box[i][k])    return {row : i, reel : k};
        }
    }

    return null;
}

function isCorrectBox(box, newBox, groupedElements) {
    for(let i = 0; i < box.length; i++) {
        for (let k = 0; k < box[i].length; k++) {
            if((newBox[i][k] === -1 && isInCluster(box[i][k], groupedElements) || (newBox[i][k] !== -1 && newBox[i][k] !== box[i][k]))) {
                return false;
            }
        }
    }
    return true;
}

console.log();