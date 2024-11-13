const box = [
    [8, 0, 5, 3, 3, 3, 7],
    [5, 0, -1, -1, 0, 3, 1],
    [7, 0, 7, 0, 0, 0, 4],
    [0, 8, 3, 6, 5, 0, 3],
    [0, 9, 9, 2, 6, 4, 1],
    [9, 9, 0, 0, 4, 6, -1]];


const nReels = 7;
const nRows = 6;
const nSymbols = 10;

const counts = new Map();
const vis = Array.from(Array(nRows), () => Array(nReels).fill(false));

const newBox = Array.from(Array(nRows), () => Array(nReels).fill(-1));

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
            vis[i][k] = true;
        }
    });
});

const sortedArray = Array.from(counts).sort((a, b) => a[1] - b[1]).reverse();
// const sortedCounts = new Map(sortedArray);

// Direction vectors
const dRow = [-1, 0, 1, 0 ];
const dCol = [0, 1, 0, -1 ];

let nextPos = [2, 3];
for(let i = 0; i < sortedArray.length; i++) {

    if(nextPos !== []) {
        const places = [];

        nextPos = BFS(box, vis, nextPos[0], nextPos[1], places, sortedArray[i][1]);

        places.forEach(pos => {
            newBox[pos.row][pos.reel] = sortedArray[i][0];
        });
    }

}

// BFS(box, vis, 2, 3);



// Function to check if a cell was visited or not
function isValid(vis, row, col)  {
    // If cell lies out of bounds
    if (row < 0 || col < 0
        || row >= nRows || col >= nReels)
        return false;

    // If cell is already visited
    if (vis[row][col])
        return false;

    // Otherwise
    return true;
}

function BFS( grid, vis,row, col, places, maxN) {
    // Stores indices of the matrix cells
    const q = [];

    let checkedN = 0;

    // Mark the starting cell as visited and push it into the queue
    q.push([row, col]);
    vis[row][col] = true;

    // Iterate while the queue is not empty
    while (q.length !== 0) {

        const cell = q[0];
        const x = cell[0];
        const y = cell[1];

        console.log( grid[x][y] + " ");
        places.push({row : x, reel : y});

        q.shift();

        checkedN++;

        // Go to the adjacent cells
        for (let i = 0; i < 4; i++) {

            const adjx = x + dRow[i];
            const adjy = y + dCol[i];

            if (isValid(vis, adjx, adjy)) {
                q.push([adjx, adjy ]);
                vis[adjx][adjy] = true;
            }

            if(checkedN === maxN) {
                return q[0];
            }
        }
    }

    return [];
}

console.log();