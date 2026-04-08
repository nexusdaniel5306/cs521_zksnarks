const test = require("node:test");
const assert = require("node:assert/strict");
const { validateProofJobRequest } = require("../../src/lib/sudokuValidation");

function makeGrid(fill) {
    return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => fill));
}

test("rejects missing puzzle", () => {
    const result = validateProofJobRequest({ solution: makeGrid(1) });
    assert.equal(result.ok, false);
    assert.equal(result.error, "puzzle is required");
});

test("rejects missing solution", () => {
    const result = validateProofJobRequest({ puzzle: makeGrid(0) });
    assert.equal(result.ok, false);
    assert.equal(result.error, "solution is required");
});

test("rejects non-9x9 puzzle shape", () => {
    const result = validateProofJobRequest({ puzzle: [[0]], solution: makeGrid(1) });
    assert.equal(result.ok, false);
    assert.equal(result.error, "puzzle must be a 9x9 array");
});

test("rejects non-integer entries", () => {
    const puzzle = makeGrid(0);
    puzzle[0][0] = 1.5;
    const result = validateProofJobRequest({ puzzle, solution: makeGrid(1) });
    assert.equal(result.ok, false);
    assert.equal(result.error, "puzzle[0][0] must be an integer");
});

test("rejects out-of-range puzzle digits", () => {
    const puzzle = makeGrid(0);
    puzzle[4][4] = 10;
    const result = validateProofJobRequest({ puzzle, solution: makeGrid(1) });
    assert.equal(result.ok, false);
    assert.equal(result.error, "puzzle[4][4] must be between 0 and 9");
});

test("rejects out-of-range solution digits", () => {
    const solution = makeGrid(1);
    solution[3][2] = 0;
    const result = validateProofJobRequest({ puzzle: makeGrid(0), solution });
    assert.equal(result.ok, false);
    assert.equal(result.error, "solution[3][2] must be between 1 and 9");
});
