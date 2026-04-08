const test = require("node:test");
const assert = require("node:assert/strict");
const { ProofQueue } = require("../../src/services/proofQueue");

test("jobs execute in FIFO order with single concurrency", async () => {
    const executionOrder = [];
    let concurrentRuns = 0;
    let maxConcurrentRuns = 0;

    const queue = new ProofQueue({
        maxQueueLength: 10,
        runJob: async (jobId) => {
            concurrentRuns += 1;
            maxConcurrentRuns = Math.max(maxConcurrentRuns, concurrentRuns);
            executionOrder.push(`${jobId}:start`);
            await new Promise((resolve) => setTimeout(resolve, 20));
            executionOrder.push(`${jobId}:end`);
            concurrentRuns -= 1;
        }
    });

    queue.enqueue("job-1", {});
    queue.enqueue("job-2", {});
    queue.enqueue("job-3", {});

    await new Promise((resolve) => setTimeout(resolve, 100));

    assert.equal(maxConcurrentRuns, 1);
    assert.deepEqual(executionOrder, [
        "job-1:start",
        "job-1:end",
        "job-2:start",
        "job-2:end",
        "job-3:start",
        "job-3:end"
    ]);
});
