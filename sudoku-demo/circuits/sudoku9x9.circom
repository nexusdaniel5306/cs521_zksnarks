pragma circom 2.1.6;

include "./components/range_checks.circom";
include "./components/distinct.circom";

template Sudoku9x9() {
    signal input puzzle[81];
    signal input solution[81];

    component puzzleRange[81];
    component solutionRange[81];

    for (var i = 0; i < 81; i++) {
        puzzleRange[i] = AssertInRange0To9();
        puzzleRange[i].in <== puzzle[i];

        solutionRange[i] = AssertInRange1To9();
        solutionRange[i].in <== solution[i];

        puzzle[i] * (solution[i] - puzzle[i]) === 0;
    }

    component rowDistinct[9];
    component colDistinct[9];
    component boxDistinct[9];

    signal rowValues[9][9];
    signal colValues[9][9];
    signal boxValues[9][9];

    for (var row = 0; row < 9; row++) {
        rowDistinct[row] = AssertAllDistinct9();

        for (var col = 0; col < 9; col++) {
            rowValues[row][col] <== solution[row * 9 + col];
            rowDistinct[row].values[col] <== rowValues[row][col];
        }
    }

    for (var col = 0; col < 9; col++) {
        colDistinct[col] = AssertAllDistinct9();

        for (var row = 0; row < 9; row++) {
            colValues[col][row] <== solution[row * 9 + col];
            colDistinct[col].values[row] <== colValues[col][row];
        }
    }

    for (var boxRow = 0; boxRow < 3; boxRow++) {
        for (var boxCol = 0; boxCol < 3; boxCol++) {
            var box = boxRow * 3 + boxCol;
            boxDistinct[box] = AssertAllDistinct9();

            for (var rowOffset = 0; rowOffset < 3; rowOffset++) {
                for (var colOffset = 0; colOffset < 3; colOffset++) {
                    var offset = rowOffset * 3 + colOffset;
                    var idx = (boxRow * 3 + rowOffset) * 9 + (boxCol * 3 + colOffset);

                    boxValues[box][offset] <== solution[idx];
                    boxDistinct[box].values[offset] <== boxValues[box][offset];
                }
            }
        }
    }
}

component main { public [puzzle] } = Sudoku9x9();
