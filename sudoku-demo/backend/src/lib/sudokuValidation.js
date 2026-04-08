function validateGridShape(grid, label, { allowZero }) {
    if (!Array.isArray(grid) || grid.length !== 9) {
        return `${label} must be a 9x9 array`;
    }

    for (let row = 0; row < 9; row++) {
        if (!Array.isArray(grid[row]) || grid[row].length !== 9) {
            return `${label} must be a 9x9 array`;
        }

        for (let col = 0; col < 9; col++) {
            const value = grid[row][col];

            if (!Number.isInteger(value)) {
                return `${label}[${row}][${col}] must be an integer`;
            }

            if (allowZero) {
                if (value < 0 || value > 9) {
                    return `${label}[${row}][${col}] must be between 0 and 9`;
                }
            } else if (value < 1 || value > 9) {
                return `${label}[${row}][${col}] must be between 1 and 9`;
            }
        }
    }

    return null;
}

function validateProofJobRequest(body) {
    if (!body || typeof body !== "object") {
        return {
            ok: false,
            error: "Request body must be a JSON object"
        };
    }

    if (!Object.prototype.hasOwnProperty.call(body, "puzzle")) {
        return {
            ok: false,
            error: "puzzle is required"
        };
    }

    if (!Object.prototype.hasOwnProperty.call(body, "solution")) {
        return {
            ok: false,
            error: "solution is required"
        };
    }

    const puzzleError = validateGridShape(body.puzzle, "puzzle", { allowZero: true });
    if (puzzleError) {
        return {
            ok: false,
            error: puzzleError
        };
    }

    const solutionError = validateGridShape(body.solution, "solution", { allowZero: false });
    if (solutionError) {
        return {
            ok: false,
            error: solutionError
        };
    }

    return {
        ok: true
    };
}

module.exports = {
    validateGridShape,
    validateProofJobRequest
};
