const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../../src/app");
const { JobStore } = require("../../src/services/jobStore");

function startServer(app) {
    return new Promise((resolve) => {
        const server = app.listen(0, "127.0.0.1", () => {
            const address = server.address();
            resolve({
                server,
                baseUrl: `http://127.0.0.1:${address.port}`
            });
        });
    });
}

function makeGrid(fill) {
    return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => fill));
}

test("health endpoint returns readiness state", async () => {
    const artifactRegistry = {
        validateArtifacts: () => ({ ready: false, missing: [{ name: "wasmPath", path: "/tmp/missing.wasm" }] })
    };
    const proofQueue = {
        size: () => 2
    };
    const jobStore = new JobStore({ jobTtlMs: 1000, cleanupIntervalMs: 0 });
    const app = createApp({ artifactRegistry, jobStore, proofQueue });
    const { server, baseUrl } = await startServer(app);

    try {
        const response = await fetch(`${baseUrl}/api/v1/health`);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.artifactsReady, false);
        assert.equal(body.queueDepth, 2);
    } finally {
        server.close();
    }
});

test("proof job creation returns 202 for valid payload", async () => {
    const artifactRegistry = {
        validateArtifacts: () => ({ ready: true, missing: [] })
    };
    const enqueued = [];
    const proofQueue = {
        size: () => enqueued.length,
        enqueue: (jobId, payload) => {
            enqueued.push({ jobId, payload });
        }
    };
    const jobStore = new JobStore({ jobTtlMs: 1000, cleanupIntervalMs: 0 });
    const app = createApp({ artifactRegistry, jobStore, proofQueue });
    const { server, baseUrl } = await startServer(app);

    try {
        const response = await fetch(`${baseUrl}/api/v1/proof-jobs`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                puzzle: makeGrid(0),
                solution: makeGrid(1)
            })
        });
        const body = await response.json();

        assert.equal(response.status, 202);
        assert.equal(body.status, "QUEUED");
        assert.ok(body.jobId);
        assert.equal(enqueued.length, 1);
    } finally {
        server.close();
    }
});

test("unknown job id returns 404", async () => {
    const artifactRegistry = {
        validateArtifacts: () => ({ ready: true, missing: [] })
    };
    const proofQueue = {
        size: () => 0,
        enqueue: () => {}
    };
    const jobStore = new JobStore({ jobTtlMs: 1000, cleanupIntervalMs: 0 });
    const app = createApp({ artifactRegistry, jobStore, proofQueue });
    const { server, baseUrl } = await startServer(app);

    try {
        const response = await fetch(`${baseUrl}/api/v1/proof-jobs/missing-job`);
        assert.equal(response.status, 404);
    } finally {
        server.close();
    }
});

test("invalid payload returns 400", async () => {
    const artifactRegistry = {
        validateArtifacts: () => ({ ready: true, missing: [] })
    };
    const proofQueue = {
        size: () => 0,
        enqueue: () => {}
    };
    const jobStore = new JobStore({ jobTtlMs: 1000, cleanupIntervalMs: 0 });
    const app = createApp({ artifactRegistry, jobStore, proofQueue });
    const { server, baseUrl } = await startServer(app);

    try {
        const response = await fetch(`${baseUrl}/api/v1/proof-jobs`, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                puzzle: [[0]]
            })
        });
        assert.equal(response.status, 400);
    } finally {
        server.close();
    }
});
