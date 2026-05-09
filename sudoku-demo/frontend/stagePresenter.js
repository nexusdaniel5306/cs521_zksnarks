(function attachStagePresenter(root) {
    const STAGE_ORDER = [
        "QUEUED",
        "VALIDATING_INPUT",
        "PREPARING_CIRCUIT_INPUT",
        "GENERATING_WITNESS",
        "GENERATING_PROOF",
        "VERIFYING_PROOF",
        "COMPLETED"
    ];

    const STAGE_PROGRESS = {
        QUEUED: 0,
        VALIDATING_INPUT: 10,
        PREPARING_CIRCUIT_INPUT: 20,
        GENERATING_WITNESS: 45,
        GENERATING_PROOF: 75,
        VERIFYING_PROOF: 90,
        COMPLETED: 100,
        FAILED: 100
    };

    const STAGE_MESSAGES = {
        QUEUED: "Proof job queued in the browser walkthrough.",
        VALIDATING_INPUT: "Checking the public puzzle and private solution shape.",
        PREPARING_CIRCUIT_INPUT: "Flattening Sudoku data into circuit inputs.",
        GENERATING_WITNESS: "Building the private witness for the Sudoku circuit.",
        GENERATING_PROOF: "Generating the Groth16 proof.",
        VERIFYING_PROOF: "Verifying the proof against public signals.",
        COMPLETED: "Proof generated and verified."
    };

    function defaultSleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function stageIndex(stage) {
        return STAGE_ORDER.indexOf(stage);
    }

    function createSyntheticJob(sourceJob, stage) {
        return {
            ...sourceJob,
            stage,
            status: stage === "COMPLETED" ? "COMPLETED" : "RUNNING",
            progressPercent: STAGE_PROGRESS[stage],
            message: STAGE_MESSAGES[stage],
            finishedAt: null,
            result: null,
            error: null,
            synthetic: true
        };
    }

    function normalizeJob(job) {
        return {
            ...job,
            progressPercent: typeof job.progressPercent === "number" ? job.progressPercent : STAGE_PROGRESS[job.stage],
            message: job.message || STAGE_MESSAGES[job.stage] || "Working on proof..."
        };
    }

    function createStagePresenter({ minStageMs = 2000, render, sleep = defaultSleep }) {
        if (typeof render !== "function") {
            throw new Error("createStagePresenter requires a render function");
        }

        let queue = [];
        let processing = false;
        let processingPromise = Promise.resolve();
        let lastRenderedStage = null;
        let stageCursor = null;
        let generation = 0;

        function expandJob(job) {
            const normalized = normalizeJob(job);
            const targetIndex = stageIndex(normalized.stage);
            const cursorIndex = stageIndex(stageCursor);

            if (targetIndex === -1 || stageCursor === normalized.stage) {
                stageCursor = normalized.stage;
                return [normalized];
            }

            if (stageCursor === null || cursorIndex === -1 || targetIndex <= cursorIndex) {
                stageCursor = normalized.stage;
                return [normalized];
            }

            const jobs = [];
            for (let index = cursorIndex + 1; index < targetIndex; index += 1) {
                jobs.push(createSyntheticJob(normalized, STAGE_ORDER[index]));
            }
            jobs.push(normalized);
            stageCursor = normalized.stage;
            return jobs;
        }

        async function processQueue(runGeneration) {
            while (queue.length > 0 && runGeneration === generation) {
                const nextJob = queue.shift();

                if (lastRenderedStage !== null && nextJob.stage !== lastRenderedStage) {
                    await sleep(minStageMs);
                }

                if (runGeneration !== generation) {
                    break;
                }

                render(nextJob);
                lastRenderedStage = nextJob.stage;
            }

            if (runGeneration === generation) {
                processing = false;
            }
        }

        function ensureProcessing() {
            if (!processing) {
                processing = true;
                processingPromise = processQueue(generation);
            }

            return processingPromise;
        }

        function enqueue(job) {
            queue.push(...expandJob(job));
            return ensureProcessing();
        }

        function reset() {
            generation += 1;
            queue = [];
            processing = false;
            processingPromise = Promise.resolve();
            lastRenderedStage = null;
            stageCursor = null;
        }

        function drain() {
            return processingPromise;
        }

        return {
            enqueue,
            drain,
            reset
        };
    }

    root.createStagePresenter = createStagePresenter;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = {
            createStagePresenter
        };
    }
})(typeof window !== "undefined" ? window : globalThis);
