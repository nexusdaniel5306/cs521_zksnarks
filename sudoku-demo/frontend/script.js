const HARD_CODED_BOARDS = [
    {
        puzzle: [
            [5, 3, 0, 0, 7, 0, 0, 0, 0],
            [6, 0, 0, 1, 9, 5, 0, 0, 0],
            [0, 9, 8, 0, 0, 0, 0, 6, 0],
            [8, 0, 0, 0, 6, 0, 0, 0, 3],
            [4, 0, 0, 8, 0, 3, 0, 0, 1],
            [7, 0, 0, 0, 2, 0, 0, 0, 6],
            [0, 6, 0, 0, 0, 0, 2, 8, 0],
            [0, 0, 0, 4, 1, 9, 0, 0, 5],
            [0, 0, 0, 0, 8, 0, 0, 7, 9]
        ],
        solution: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ]
    },
    {
        puzzle: [
            [0, 0, 0, 2, 6, 0, 7, 0, 1],
            [6, 8, 0, 0, 7, 0, 0, 9, 0],
            [1, 9, 0, 0, 0, 4, 5, 0, 0],
            [8, 2, 0, 1, 0, 0, 0, 4, 0],
            [0, 0, 4, 6, 0, 2, 9, 0, 0],
            [0, 5, 0, 0, 0, 3, 0, 2, 8],
            [0, 0, 9, 3, 0, 0, 0, 7, 4],
            [0, 4, 0, 0, 5, 0, 0, 3, 6],
            [7, 0, 3, 0, 1, 8, 0, 0, 0]
        ],
        solution: [
            [4, 3, 5, 2, 6, 9, 7, 8, 1],
            [6, 8, 2, 5, 7, 1, 4, 9, 3],
            [1, 9, 7, 8, 3, 4, 5, 6, 2],
            [8, 2, 6, 1, 9, 5, 3, 4, 7],
            [3, 7, 4, 6, 8, 2, 9, 1, 5],
            [9, 5, 1, 7, 4, 3, 6, 2, 8],
            [5, 1, 9, 3, 2, 6, 8, 7, 4],
            [2, 4, 8, 9, 5, 7, 1, 3, 6],
            [7, 6, 3, 4, 1, 8, 2, 5, 9]
        ]
    }
];

const boardContainer = document.getElementById("board");
const statusText = document.getElementById("statusText");
const stageText = document.getElementById("stageText");
const progressText = document.getElementById("progressText");
const messageText = document.getElementById("messageText");
const resultBox = document.getElementById("resultBox");

let activeBoard = HARD_CODED_BOARDS[0];
let currentPuzzle = cloneGrid(activeBoard.puzzle);
let currentEntries = cloneGrid(activeBoard.puzzle);

function cloneGrid(grid) {
    return grid.map((row) => [...row]);
}

function loadRandomBoard() {
    const index = Math.floor(Math.random() * HARD_CODED_BOARDS.length);
    activeBoard = HARD_CODED_BOARDS[index];
    currentPuzzle = cloneGrid(activeBoard.puzzle);
    currentEntries = cloneGrid(activeBoard.puzzle);
    renderBoard();
    resetStatus("Random puzzle loaded. Fill it in or auto-solve.");
}

function renderBoard() {
    boardContainer.replaceChildren();

    for (let row = 0; row < 9; row += 1) {
        for (let col = 0; col < 9; col += 1) {
            const isClue = currentPuzzle[row][col] !== 0;
            const input = document.createElement("input");
            input.type = "text";
            input.inputMode = "numeric";
            input.maxLength = 1;
            input.className = `cell ${isClue ? "clue" : ""}`;
            input.dataset.row = String(row);
            input.dataset.col = String(col);
            input.value = currentEntries[row][col] === 0 ? "" : String(currentEntries[row][col]);
            input.disabled = isClue;

            if (!isClue) {
                input.addEventListener("input", (event) => {
                    const value = sanitizeCellValue(event.target.value);
                    event.target.value = value === 0 ? "" : String(value);
                    currentEntries[row][col] = value;
                });
            }

            boardContainer.appendChild(input);
        }
    }
}

function sanitizeCellValue(rawValue) {
    const digit = Number(rawValue.replace(/[^1-9]/g, "").slice(-1));
    if (!Number.isInteger(digit) || digit < 1 || digit > 9) {
        return 0;
    }

    return digit;
}

function autoSolveBoard() {
    currentEntries = cloneGrid(activeBoard.solution);
    renderBoard();
    resetStatus("Board auto-solved. Submit to generate a proof.");
}

function buildSolutionSubmission() {
    return currentEntries.map((row) =>
        row.map((value) => (Number.isInteger(value) ? value : 0))
    );
}

function setStatus({ status, stage, progress, message }) {
    statusText.textContent = status;
    stageText.textContent = stage;
    progressText.textContent = `${progress}%`;
    messageText.textContent = message;
}

function resetStatus(message) {
    setStatus({
        status: "Not started",
        stage: "-",
        progress: 0,
        message
    });
    resultBox.classList.add("hidden");
    resultBox.textContent = "";
    resultBox.className = "result-box hidden";
}

async function submitProofJob() {
    const payload = {
        puzzle: currentPuzzle,
        solution: buildSolutionSubmission()
    };

    setStatus({
        status: "QUEUED",
        stage: "QUEUED",
        progress: 0,
        message: "Submitting proof job..."
    });

    try {
        const createResponse = await fetch("/api/v1/proof-jobs", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const created = await createResponse.json();
        if (!createResponse.ok) {
            throw new Error(created.error?.message || "Failed to create proof job");
        }

        await pollProofJob(created.jobId);
    } catch (error) {
        setStatus({
            status: "FAILED",
            stage: "FAILED",
            progress: 0,
            message: error.message
        });
        showResult(false, error.message);
    }
}

async function pollProofJob(jobId) {
    let done = false;
    while (!done) {
        const response = await fetch(`/api/v1/proof-jobs/${jobId}`);
        const job = await response.json();

        if (!response.ok) {
            throw new Error(job.error?.message || "Failed while polling proof job");
        }

        setStatus({
            status: job.status,
            stage: job.stage,
            progress: job.progressPercent,
            message: job.message || "Working on proof..."
        });

        if (job.status === "COMPLETED") {
            showResult(job.result?.verified === true, "Proof verified without revealing the solved board.");
            done = true;
            break;
        }

        if (job.status === "FAILED") {
            showResult(false, job.error?.message || "Proof generation failed");
            done = true;
            break;
        }

        await new Promise((resolve) => setTimeout(resolve, 900));
    }
}

function showResult(ok, message) {
    resultBox.classList.remove("hidden");
    resultBox.classList.add(ok ? "success" : "error");
    resultBox.textContent = message;
}

document.getElementById("randomPuzzleBtn").addEventListener("click", loadRandomBoard);
document.getElementById("autoSolveBtn").addEventListener("click", autoSolveBoard);
document.getElementById("submitBtn").addEventListener("click", submitProofJob);

renderBoard();
resetStatus("Load a puzzle and submit a completed board.");
