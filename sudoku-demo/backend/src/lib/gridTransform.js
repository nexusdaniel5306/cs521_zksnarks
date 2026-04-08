function flattenGrid(grid) {
    return grid.flat();
}

function toCircuitInput({ puzzle, solution }) {
    return {
        puzzle: flattenGrid(puzzle),
        solution: flattenGrid(solution)
    };
}

module.exports = {
    flattenGrid,
    toCircuitInput
};
