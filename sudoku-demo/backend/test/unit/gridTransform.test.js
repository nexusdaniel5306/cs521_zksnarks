const test = require("node:test");
const assert = require("node:assert/strict");
const { flattenGrid, toCircuitInput } = require("../../src/lib/gridTransform");

test("flattenGrid preserves row-major order", () => {
    const grid = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [10, 11, 12, 13, 14, 15, 16, 17, 18],
        [19, 20, 21, 22, 23, 24, 25, 26, 27],
        [28, 29, 30, 31, 32, 33, 34, 35, 36],
        [37, 38, 39, 40, 41, 42, 43, 44, 45],
        [46, 47, 48, 49, 50, 51, 52, 53, 54],
        [55, 56, 57, 58, 59, 60, 61, 62, 63],
        [64, 65, 66, 67, 68, 69, 70, 71, 72],
        [73, 74, 75, 76, 77, 78, 79, 80, 81]
    ];

    const flattened = flattenGrid(grid);
    assert.equal(flattened.length, 81);
    assert.deepEqual(flattened.slice(0, 12), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    assert.deepEqual(flattened.slice(-4), [78, 79, 80, 81]);
});

test("toCircuitInput returns flattened puzzle and solution arrays", () => {
    const puzzle = Array.from({ length: 9 }, (_, row) => Array.from({ length: 9 }, (_, col) => row + col));
    const solution = Array.from({ length: 9 }, (_, row) => Array.from({ length: 9 }, (_, col) => row * 9 + col + 1));
    const input = toCircuitInput({ puzzle, solution });

    assert.equal(input.puzzle.length, 81);
    assert.equal(input.solution.length, 81);
    assert.equal(input.puzzle[9], 1);
    assert.equal(input.solution[80], 81);
});
