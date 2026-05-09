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
const techDrawer = document.getElementById("techDrawer");
const progressFill = document.getElementById("progressFill");
const stageTimeline = document.getElementById("stageTimeline");
const kpiFilled = document.getElementById("kpiFilled");
const kpiClues = document.getElementById("kpiClues");
const kpiJob = document.getElementById("kpiJob");
const kpiElapsed = document.getElementById("kpiElapsed");
const stageLog = document.getElementById("stageLog");
const latencyChart = document.getElementById("latencyChart");
const clearRunsBtn = document.getElementById("clearRunsBtn");
const randomPuzzleBtn = document.getElementById("randomPuzzleBtn");
const autoSolveBtn = document.getElementById("autoSolveBtn");
const submitBtn = document.getElementById("submitBtn");
const techJobId = document.getElementById("techJobId");
const techCreatedAt = document.getElementById("techCreatedAt");
const techStartedAt = document.getElementById("techStartedAt");
const techFinishedAt = document.getElementById("techFinishedAt");
const techTimings = document.getElementById("techTimings");
const techProof = document.getElementById("techProof");
const techPublicSignals = document.getElementById("techPublicSignals");
const techErrorBlock = document.getElementById("techErrorBlock");
const techError = document.getElementById("techError");

let activeBoard = HARD_CODED_BOARDS[0];
let currentPuzzle = cloneGrid(activeBoard.puzzle);
let currentEntries = cloneGrid(activeBoard.puzzle);
let elapsedTicker = null;
let activeJobMeta = null;
let previousStage = null;
let lastStatus = null;
const runHistory = [];
const DEMO_STAGE_DELAY_MS = 2000;
const stagePresenter = createStagePresenter({
    minStageMs: DEMO_STAGE_DELAY_MS,
    render: renderPresentedJob
});

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
                    updateBoardStats();
                });
            }

            boardContainer.appendChild(input);
        }
    }

    updateBoardStats();
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
    progressFill.style.width = `${Math.max(0, Math.min(100, Number(progress) || 0))}%`;
    updateTimeline(stage, status);
    appendStageEvent(stage, message, status);
}

function renderPresentedJob(job) {
    setStatus({
        status: job.status,
        stage: job.stage,
        progress: job.progressPercent,
        message: job.message || "Working on proof..."
    });
}

function setControlsBusy(isBusy) {
    randomPuzzleBtn.disabled = isBusy;
    autoSolveBtn.disabled = isBusy;
    submitBtn.disabled = isBusy;
}

function resetStatus(message) {
    clearElapsedTicker();
    stagePresenter.reset();
    activeJobMeta = null;
    previousStage = null;
    lastStatus = null;
    setStatus({
        status: "Not started",
        stage: "-",
        progress: 0,
        message
    });
    resultBox.classList.add("hidden");
    resultBox.textContent = "";
    resultBox.className = "result-box hidden";
    kpiJob.textContent = "None";
    kpiElapsed.textContent = "-";
    setControlsBusy(false);
    clearTechnicalDetails();
}

function clearTechnicalDetails() {
    techDrawer.classList.add("hidden");
    techDrawer.open = false;
    techJobId.textContent = "—";
    techCreatedAt.textContent = "—";
    techStartedAt.textContent = "—";
    techFinishedAt.textContent = "—";
    techTimings.textContent = "—";
    techProof.textContent = "—";
    techPublicSignals.textContent = "—";
    techErrorBlock.classList.add("hidden");
    techError.textContent = "";
}

function formatLogTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString();
}

function appendStageEvent(stage, message, status) {
    if (!stage || stage === "-" || !message) {
        return;
    }

    if (stage === previousStage && status === lastStatus) {
        return;
    }

    previousStage = stage;
    lastStatus = status;

    const empty = stageLog.querySelector(".stage-log-empty");
    if (empty) {
        empty.remove();
    }

    const item = document.createElement("li");
    item.className = "stage-log-item";
    item.innerHTML = `
        <div>
            <span class="stage-log-ts">${formatLogTimestamp()}</span>
            <span class="stage-log-stage">${stage}</span>
        </div>
        <div class="stage-log-message">${message}</div>
    `;
    stageLog.prepend(item);

    const items = stageLog.querySelectorAll(".stage-log-item");
    if (items.length > 16) {
        items[items.length - 1].remove();
    }
}

function getTotalLatencySeconds(job) {
    const stages = Object.values(job?.timingsMs || {});
    if (stages.length === 0) {
        if (!job?.createdAt || !job?.finishedAt) {
            return null;
        }
        const createdAt = new Date(job.createdAt).valueOf();
        const finishedAt = new Date(job.finishedAt).valueOf();
        if (Number.isNaN(createdAt) || Number.isNaN(finishedAt)) {
            return null;
        }
        return Math.max(0, (finishedAt - createdAt) / 1000);
    }

    const totalMs = stages.reduce((sum, value) => sum + (typeof value === "number" ? value : 0), 0);
    return Math.max(0, totalMs / 1000);
}

function renderLatencyChart() {
    latencyChart.replaceChildren();
    if (runHistory.length === 0) {
        const empty = document.createElement("div");
        empty.className = "chart-empty";
        empty.textContent = "Run one proof to populate chart.";
        latencyChart.appendChild(empty);
        return;
    }

    const visible = runHistory.slice(-14);
    const maxLatency = Math.max(...visible.map((run) => run.seconds), 1);

    visible.forEach((run, idx) => {
        const bar = document.createElement("div");
        bar.className = "latency-bar";
        const scaledHeight = 12 + Math.round((run.seconds / maxLatency) * 132);
        bar.style.height = `${scaledHeight}px`;
        bar.dataset.label = `Run ${idx + 1}: ${run.seconds.toFixed(2)}s`;
        latencyChart.appendChild(bar);
    });
}

function maybeCaptureRun(job) {
    if (job.status !== "COMPLETED" || !job.finishedAt || !job.jobId) {
        return;
    }

    if (runHistory.some((entry) => entry.jobId === job.jobId)) {
        return;
    }

    const seconds = getTotalLatencySeconds(job);
    if (seconds === null) {
        return;
    }

    runHistory.push({
        jobId: job.jobId,
        seconds
    });
    renderLatencyChart();
}

function formatTime(iso) {
    if (!iso) {
        return "—";
    }

    const date = new Date(iso);
    if (Number.isNaN(date.valueOf())) {
        return "—";
    }

    return date.toLocaleTimeString();
}

function updateElapsedLabel() {
    if (!activeJobMeta?.createdAt && !activeJobMeta?.visibleStartedAtMs) {
        kpiElapsed.textContent = "-";
        return;
    }

    const start = activeJobMeta.visibleStartedAtMs || new Date(activeJobMeta.createdAt).valueOf();
    if (Number.isNaN(start)) {
        kpiElapsed.textContent = "-";
        return;
    }

    const terminal = activeJobMeta.visibleFinishedAtMs || Date.now();
    const seconds = Math.max(0, Math.floor((terminal - start) / 1000));
    kpiElapsed.textContent = `${seconds}s`;
}

function clearElapsedTicker() {
    if (elapsedTicker) {
        clearInterval(elapsedTicker);
        elapsedTicker = null;
    }
}

function startElapsedTicker() {
    clearElapsedTicker();
    updateElapsedLabel();
    elapsedTicker = setInterval(updateElapsedLabel, 1000);
}

function updateTimeline(stage, status) {
    const stageNames = Array.from(stageTimeline.querySelectorAll(".timeline-item"), (item) => item.dataset.stage || item.textContent);
    const activeIndex = stageNames.indexOf(stage);

    Array.from(stageTimeline.children).forEach((item, idx) => {
        item.classList.remove("done", "active");
        if (status === "FAILED") {
            if (idx < Math.max(0, activeIndex)) {
                item.classList.add("done");
            }
            if (idx === Math.max(0, activeIndex)) {
                item.classList.add("active");
            }
            return;
        }

        if (activeIndex >= 0) {
            if (idx < activeIndex) {
                item.classList.add("done");
            } else if (idx === activeIndex) {
                item.classList.add("active");
            }
        }

        if (status === "COMPLETED" && idx <= stageNames.indexOf("COMPLETED")) {
            item.classList.add("done");
            item.classList.remove("active");
        }
    });
}

function updateBoardStats() {
    const flatPuzzle = currentPuzzle.flat();
    const flatEntries = currentEntries.flat();
    const clueCount = flatPuzzle.filter((value) => value !== 0).length;
    const filledCount = flatEntries.filter((value) => value !== 0).length;
    kpiClues.textContent = String(clueCount);
    kpiFilled.textContent = `${filledCount} / 81`;
}

function formatTimingsMs(timingsMs) {
    if (!timingsMs || typeof timingsMs !== "object") {
        return "—";
    }

    const entries = Object.entries(timingsMs).filter(([, ms]) => typeof ms === "number");
    if (entries.length === 0) {
        return "—";
    }

    entries.sort((a, b) => a[1] - b[1]);
    return entries.map(([stage, ms]) => `${stage}: ${ms}`).join("\n");
}

function renderTechnicalDetails(job) {
    techDrawer.classList.remove("hidden");
    techJobId.textContent = job.jobId || "—";
    techCreatedAt.textContent = formatTime(job.createdAt);
    techStartedAt.textContent = formatTime(job.startedAt);
    techFinishedAt.textContent = formatTime(job.finishedAt);
    techTimings.textContent = formatTimingsMs(job.timingsMs);

    if (job.error) {
        techErrorBlock.classList.remove("hidden");
        techError.textContent = JSON.stringify(job.error, null, 2);
    } else {
        techErrorBlock.classList.add("hidden");
        techError.textContent = "";
    }

    if (job.result?.proof) {
        techProof.textContent = JSON.stringify(job.result.proof, null, 2);
    } else {
        techProof.textContent = job.status === "COMPLETED" ? "(no proof in response)" : "—";
    }

    if (job.result?.publicSignals !== undefined && job.result?.publicSignals !== null) {
        techPublicSignals.textContent = JSON.stringify(job.result.publicSignals, null, 2);
    } else {
        techPublicSignals.textContent = "—";
    }
}

async function submitProofJob() {
    setControlsBusy(true);
    stagePresenter.reset();
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

        renderTechnicalDetails({
            jobId: created.jobId,
            status: created.status,
            createdAt: created.createdAt,
            startedAt: null,
            finishedAt: null,
            timingsMs: {},
            result: null
        });

        kpiJob.textContent = created.jobId.slice(0, 8);
        activeJobMeta = {
            createdAt: created.createdAt,
            visibleStartedAtMs: Date.now(),
            visibleFinishedAtMs: null
        };
        startElapsedTicker();
        stagePresenter.enqueue({
            ...created,
            message: "Proof job accepted. Starting demo-paced walkthrough."
        });

        await pollProofJob(created.jobId);
    } catch (error) {
        stagePresenter.reset();
        setStatus({
            status: "FAILED",
            stage: "FAILED",
            progress: 0,
            message: error.message
        });
        showResult(false, error.message);
        setControlsBusy(false);
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

        kpiJob.textContent = job.jobId ? job.jobId.slice(0, 8) : "Unknown";
        activeJobMeta = {
            createdAt: job.createdAt || activeJobMeta?.createdAt || null,
            visibleStartedAtMs: activeJobMeta?.visibleStartedAtMs || Date.now(),
            visibleFinishedAtMs: activeJobMeta?.visibleFinishedAtMs || null
        };
        updateElapsedLabel();
        if (!activeJobMeta.visibleFinishedAtMs && !elapsedTicker) {
            startElapsedTicker();
        }

        renderTechnicalDetails(job);
        maybeCaptureRun(job);
        stagePresenter.enqueue(job);

        if (job.status === "COMPLETED") {
            await stagePresenter.drain();
            activeJobMeta.visibleFinishedAtMs = Date.now();
            updateElapsedLabel();
            clearElapsedTicker();
            showResult(job.result?.verified === true, "Proof verified without revealing the solved board.");
            setControlsBusy(false);
            done = true;
            break;
        }

        if (job.status === "FAILED") {
            await stagePresenter.drain();
            activeJobMeta.visibleFinishedAtMs = Date.now();
            updateElapsedLabel();
            clearElapsedTicker();
            showResult(false, job.error?.message || "Proof generation failed");
            setControlsBusy(false);
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

randomPuzzleBtn.addEventListener("click", loadRandomBoard);
autoSolveBtn.addEventListener("click", autoSolveBoard);
submitBtn.addEventListener("click", submitProofJob);
clearRunsBtn.addEventListener("click", () => {
    runHistory.length = 0;
    renderLatencyChart();
});

renderBoard();
resetStatus("Load a puzzle and submit a completed board.");
renderLatencyChart();
