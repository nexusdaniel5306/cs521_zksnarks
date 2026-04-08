const os = require("os");
const path = require("path");

function createConfig(overrides = {}) {
    const sudokuDemoRoot = path.resolve(__dirname, "..", "..");
    const backendRoot = path.resolve(__dirname, "..");
    const artifactsDir = path.join(sudokuDemoRoot, "artifacts");
    const circuitName = process.env.CIRCUIT_NAME || "sudoku9x9";

    return {
        port: Number(process.env.PORT || 3000),
        host: process.env.HOST || "127.0.0.1",
        maxQueueLength: Number(process.env.MAX_QUEUE_LENGTH || 25),
        jobTtlMs: Number(process.env.JOB_TTL_MS || 60 * 60 * 1000),
        cleanupIntervalMs: Number(process.env.JOB_CLEANUP_INTERVAL_MS || 5 * 60 * 1000),
        tempRoot: process.env.TEMP_ROOT || os.tmpdir(),
        startupArtifactCheck: process.env.SKIP_ARTIFACT_CHECK !== "true",
        circuitName,
        sudokuDemoRoot,
        backendRoot,
        artifactsDir,
        examplesDir: path.join(sudokuDemoRoot, "examples"),
        artifactPaths: {
            artifactsDir,
            circuitName,
            wasmPath: path.join(artifactsDir, `${circuitName}_js`, `${circuitName}.wasm`),
            generateWitnessPath: path.join(artifactsDir, `${circuitName}_js`, "generate_witness.js"),
            witnessCalculatorPath: path.join(artifactsDir, `${circuitName}_js`, "witness_calculator.js"),
            zkeyPath: path.join(artifactsDir, `${circuitName}_final.zkey`),
            verificationKeyPath: path.join(artifactsDir, "verification_key.json")
        },
        ...overrides
    };
}

module.exports = {
    createConfig
};
