const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { createConfig } = require("../../src/config");
const { createApp } = require("../../src/app");
const { ArtifactRegistry } = require("../../src/services/artifactRegistry");
const { JobStore } = require("../../src/services/jobStore");
const { ProofQueue } = require("../../src/services/proofQueue");
const { ProofRunner } = require("../../src/services/proofRunner");
const { StageReporter } = require("../../src/services/stageReporter");

function createServer() {
    const config = createConfig({
        cleanupIntervalMs: 0
    });
    const artifactRegistry = new ArtifactRegistry(config);
    const validation = artifactRegistry.validateArtifacts();

    if (!validation.ready) {
        return null;
    }

    const jobStore = new JobStore({
        jobTtlMs: config.jobTtlMs,
        cleanupIntervalMs: 0
    });
    const stageReporter = new StageReporter(jobStore);
    const proofRunner = new ProofRunner({
        config,
        artifactRegistry,
        stageReporter
    });
    const proofQueue = new ProofQueue({
        maxQueueLength: config.maxQueueLength,
        runJob: (jobId, payload) => proofRunner.run(jobId, payload)
    });
    const app = createApp({
        artifactRegistry,
        jobStore,
        proofQueue
    });

    return new Promise((resolve) => {
        const server = app.listen(0, "127.0.0.1", () => {
            resolve({
                server,
                baseUrl: `http://127.0.0.1:${server.address().port}`,
                jobStore
            });
        });
    });
}

async function readExampleJson(fileName) {
    const config = createConfig();
    const filePath = path.join(config.examplesDir, fileName);
    return JSON.parse(await fs.promises.readFile(filePath, "utf8"));
}

async function createProofJob(baseUrl, puzzle, solution) {
    const response = await fetch(`${baseUrl}/api/v1/proof-jobs`, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({ puzzle, solution })
    });

    return {
        status: response.status,
        body: await response.json()
    };
}

async function waitForJob(baseUrl, jobId) {
    for (let attempt = 0; attempt < 120; attempt++) {
        const response = await fetch(`${baseUrl}/api/v1/proof-jobs/${jobId}`);
        const body = await response.json();

        if (body.status === "COMPLETED" || body.status === "FAILED") {
            return body;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(`Timed out waiting for proof job ${jobId}`);
}

test("valid puzzle and solution produce a verified proof", { timeout: 120000 }, async (t) => {
    const serverContext = await createServer();
    if (!serverContext) {
        t.skip("Proof artifacts are not built");
        return;
    }

    const { server, baseUrl, jobStore } = serverContext;
    const puzzle = await readExampleJson("puzzle-valid.json");
    const solution = await readExampleJson("solution-valid.json");

    try {
        const created = await createProofJob(baseUrl, puzzle, solution);
        assert.equal(created.status, 202);

        const completed = await waitForJob(baseUrl, created.body.jobId);
        assert.equal(completed.status, "COMPLETED");
        assert.equal(completed.result.verified, true);
        assert.ok(completed.result.proof);
        assert.ok(Array.isArray(completed.result.publicSignals));
    } finally {
        jobStore.dispose();
        server.close();
    }
});

test("clue mismatch fails proof generation", { timeout: 120000 }, async (t) => {
    const serverContext = await createServer();
    if (!serverContext) {
        t.skip("Proof artifacts are not built");
        return;
    }

    const { server, baseUrl, jobStore } = serverContext;
    const puzzle = await readExampleJson("puzzle-valid.json");
    const solution = await readExampleJson("solution-valid.json");
    solution[0][0] = 9;

    try {
        const created = await createProofJob(baseUrl, puzzle, solution);
        assert.equal(created.status, 202);

        const completed = await waitForJob(baseUrl, created.body.jobId);
        assert.equal(completed.status, "FAILED");
        assert.ok(completed.error);
    } finally {
        jobStore.dispose();
        server.close();
    }
});

test("row duplicate fails proof generation", { timeout: 120000 }, async (t) => {
    const serverContext = await createServer();
    if (!serverContext) {
        t.skip("Proof artifacts are not built");
        return;
    }

    const { server, baseUrl, jobStore } = serverContext;
    const puzzle = await readExampleJson("puzzle-valid.json");
    const solution = await readExampleJson("solution-valid.json");
    solution[0][1] = solution[0][0];

    try {
        const created = await createProofJob(baseUrl, puzzle, solution);
        assert.equal(created.status, 202);

        const completed = await waitForJob(baseUrl, created.body.jobId);
        assert.equal(completed.status, "FAILED");
        assert.ok(completed.error);
    } finally {
        jobStore.dispose();
        server.close();
    }
});

test("column duplicate fails proof generation", { timeout: 120000 }, async (t) => {
    const serverContext = await createServer();
    if (!serverContext) {
        t.skip("Proof artifacts are not built");
        return;
    }

    const { server, baseUrl, jobStore } = serverContext;
    const puzzle = await readExampleJson("puzzle-valid.json");
    const solution = await readExampleJson("solution-valid.json");
    solution[1][0] = solution[0][0];

    try {
        const created = await createProofJob(baseUrl, puzzle, solution);
        assert.equal(created.status, 202);

        const completed = await waitForJob(baseUrl, created.body.jobId);
        assert.equal(completed.status, "FAILED");
        assert.ok(completed.error);
    } finally {
        jobStore.dispose();
        server.close();
    }
});

test("box duplicate fails proof generation", { timeout: 120000 }, async (t) => {
    const serverContext = await createServer();
    if (!serverContext) {
        t.skip("Proof artifacts are not built");
        return;
    }

    const { server, baseUrl, jobStore } = serverContext;
    const puzzle = await readExampleJson("puzzle-valid.json");
    const solution = await readExampleJson("solution-valid.json");
    solution[1][1] = solution[0][0];

    try {
        const created = await createProofJob(baseUrl, puzzle, solution);
        assert.equal(created.status, 202);

        const completed = await waitForJob(baseUrl, created.body.jobId);
        assert.equal(completed.status, "FAILED");
        assert.ok(completed.error);
    } finally {
        jobStore.dispose();
        server.close();
    }
});
