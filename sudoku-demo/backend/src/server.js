const { createConfig } = require("./config");
const { createApp } = require("./app");
const { ArtifactRegistry } = require("./services/artifactRegistry");
const { JobStore } = require("./services/jobStore");
const { ProofQueue } = require("./services/proofQueue");
const { ProofRunner } = require("./services/proofRunner");
const { StageReporter } = require("./services/stageReporter");

async function main() {
    const config = createConfig();
    const artifactRegistry = new ArtifactRegistry(config);

    if (config.startupArtifactCheck) {
        artifactRegistry.assertReady();
    }

    const jobStore = new JobStore({
        jobTtlMs: config.jobTtlMs,
        cleanupIntervalMs: config.cleanupIntervalMs
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
        proofQueue,
        frontendDir: config.frontendDir
    });

    const server = app.listen(config.port, config.host, () => {
        console.log(`Sudoku proof backend listening on http://${config.host}:${config.port}`);
    });

    const shutdown = () => {
        jobStore.dispose();
        server.close(() => process.exit(0));
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
