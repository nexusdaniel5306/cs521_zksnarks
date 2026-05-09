const test = require("node:test");
const assert = require("node:assert/strict");
const { createStagePresenter } = require("../../../frontend/stagePresenter");

test("stage presenter releases backend updates in order with a minimum visible delay", async () => {
    const visibleJobs = [];
    const pendingSleeps = [];
    const presenter = createStagePresenter({
        minStageMs: 2000,
        render: (job) => {
            visibleJobs.push(job.stage);
        },
        sleep: (ms) => {
            pendingSleeps.push(ms);
            return Promise.resolve();
        }
    });

    await presenter.enqueue({ stage: "QUEUED", status: "QUEUED" });
    await presenter.enqueue({ stage: "VALIDATING_INPUT", status: "RUNNING" });
    await presenter.enqueue({ stage: "PREPARING_CIRCUIT_INPUT", status: "RUNNING" });
    await presenter.drain();

    assert.deepEqual(visibleJobs, ["QUEUED", "VALIDATING_INPUT", "PREPARING_CIRCUIT_INPUT"]);
    assert.deepEqual(pendingSleeps, [2000, 2000]);
});

test("stage presenter renders repeated stage updates immediately without duplicate delay", async () => {
    const visibleJobs = [];
    let sleepCount = 0;
    const presenter = createStagePresenter({
        minStageMs: 2000,
        render: (job) => {
            visibleJobs.push(`${job.stage}:${job.message}`);
        },
        sleep: () => {
            sleepCount += 1;
            return Promise.resolve();
        }
    });

    await presenter.enqueue({ stage: "GENERATING_PROOF", status: "RUNNING", message: "first" });
    await presenter.enqueue({ stage: "GENERATING_PROOF", status: "RUNNING", message: "second" });
    await presenter.drain();

    assert.deepEqual(visibleJobs, ["GENERATING_PROOF:first", "GENERATING_PROOF:second"]);
    assert.equal(sleepCount, 0);
});

test("stage presenter fills skipped backend stages for a complete demo walkthrough", async () => {
    const visibleJobs = [];
    const presenter = createStagePresenter({
        minStageMs: 2000,
        render: (job) => {
            visibleJobs.push(job.stage);
        },
        sleep: () => Promise.resolve()
    });

    await presenter.enqueue({ stage: "QUEUED", status: "QUEUED" });
    await presenter.enqueue({
        stage: "COMPLETED",
        status: "COMPLETED",
        progressPercent: 100,
        message: "Proof generated and verified"
    });
    await presenter.drain();

    assert.deepEqual(visibleJobs, [
        "QUEUED",
        "VALIDATING_INPUT",
        "PREPARING_CIRCUIT_INPUT",
        "GENERATING_WITNESS",
        "GENERATING_PROOF",
        "VERIFYING_PROOF",
        "COMPLETED"
    ]);
});
