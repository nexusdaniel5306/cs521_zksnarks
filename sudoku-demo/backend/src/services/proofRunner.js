const fs = require("fs/promises");
const { validateProofJobRequest } = require("../lib/sudokuValidation");
const { toCircuitInput } = require("../lib/gridTransform");
const { createJobTempPaths, cleanupJobTempPaths } = require("../lib/tempPaths");
const { runGroth16Prove, runGroth16Verify } = require("../lib/execSnarkjs");
const { JOB_STAGE } = require("../types/jobShapes");

class ProofRunner {
    constructor({ config, artifactRegistry, stageReporter }) {
        this.config = config;
        this.artifactRegistry = artifactRegistry;
        this.stageReporter = stageReporter;
    }

    async run(jobId, payload) {
        let tempPaths = null;

        try {
            this.stageReporter.setStage(jobId, JOB_STAGE.VALIDATING_INPUT, "Validating Sudoku payload");
            const validation = validateProofJobRequest(payload);
            if (!validation.ok) {
                throw this.createJobError("INVALID_PAYLOAD", validation.error);
            }

            this.artifactRegistry.assertReady();
            const artifactPaths = this.artifactRegistry.getPaths();

            this.stageReporter.setStage(jobId, JOB_STAGE.PREPARING_CIRCUIT_INPUT, "Preparing circuit input");
            const circuitInput = toCircuitInput(payload);
            tempPaths = await createJobTempPaths(this.config.tempRoot, jobId);
            await fs.writeFile(tempPaths.inputPath, JSON.stringify(circuitInput, null, 2));

            this.stageReporter.setStage(jobId, JOB_STAGE.GENERATING_WITNESS, "Generating witness from Sudoku circuit input");
            await this.generateWitness({
                circuitInput,
                wasmPath: artifactPaths.wasmPath,
                witnessCalculatorPath: artifactPaths.witnessCalculatorPath,
                witnessPath: tempPaths.witnessPath
            });

            this.stageReporter.setStage(jobId, JOB_STAGE.GENERATING_PROOF, "Generating Groth16 proof");
            await runGroth16Prove({
                zkeyPath: artifactPaths.zkeyPath,
                witnessPath: tempPaths.witnessPath,
                proofPath: tempPaths.proofPath,
                publicPath: tempPaths.publicPath,
                cwd: this.config.sudokuDemoRoot
            });

            this.stageReporter.setStage(jobId, JOB_STAGE.VERIFYING_PROOF, "Verifying Groth16 proof");
            const verification = await runGroth16Verify({
                verificationKeyPath: artifactPaths.verificationKeyPath,
                publicPath: tempPaths.publicPath,
                proofPath: tempPaths.proofPath,
                cwd: this.config.sudokuDemoRoot
            });

            const [proofRaw, publicSignalsRaw] = await Promise.all([
                fs.readFile(tempPaths.proofPath, "utf8"),
                fs.readFile(tempPaths.publicPath, "utf8")
            ]);

            this.stageReporter.complete(jobId, {
                verified: verification.verified,
                proof: JSON.parse(proofRaw),
                publicSignals: JSON.parse(publicSignalsRaw)
            });
        } catch (error) {
            this.stageReporter.fail(jobId, this.toErrorShape(error));
        } finally {
            await cleanupJobTempPaths(tempPaths);
        }
    }

    async generateWitness({ circuitInput, wasmPath, witnessCalculatorPath, witnessPath }) {
        const witnessCalculatorBuilder = require(witnessCalculatorPath);
        const wasmBuffer = await fs.readFile(wasmPath);
        const witnessCalculator = await witnessCalculatorBuilder(wasmBuffer);
        const witnessBuffer = await witnessCalculator.calculateWTNSBin(circuitInput, 0);
        await fs.writeFile(witnessPath, witnessBuffer);
    }

    createJobError(code, message) {
        const error = new Error(message);
        error.jobCode = code;
        return error;
    }

    toErrorShape(error) {
        return {
            code: error.jobCode || error.code || "PROOF_JOB_FAILED",
            message: error.message || "Unknown proof job error"
        };
    }
}

module.exports = {
    ProofRunner
};
