const test = require("node:test");
const assert = require("node:assert/strict");
const { JobStore } = require("../../src/services/jobStore");

test("createJob and updateJob store state", () => {
    const store = new JobStore({ jobTtlMs: 1000, cleanupIntervalMs: 0 });
    const job = store.createJob({ puzzle: [], solution: [] });

    const updated = store.updateJob(job.jobId, {
        message: "updated"
    });

    assert.equal(updated.message, "updated");
    assert.equal(store.getJob(job.jobId).message, "updated");
});

test("cleanupExpiredJobs removes old completed jobs", () => {
    const store = new JobStore({ jobTtlMs: 1000, cleanupIntervalMs: 0 });
    const job = store.createJob({ puzzle: [], solution: [] });
    store.updateJob(job.jobId, {
        finishedAt: new Date(0).toISOString()
    });

    store.cleanupExpiredJobs(2000);
    assert.equal(store.getJob(job.jobId), null);
});
