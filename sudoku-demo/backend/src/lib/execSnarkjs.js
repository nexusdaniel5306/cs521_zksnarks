const { spawn } = require("child_process");

class SnarkjsExecutionError extends Error {
    constructor(message, details) {
        super(message);
        this.name = "SnarkjsExecutionError";
        this.code = details.code;
        this.exitCode = details.exitCode;
        this.stdout = details.stdout;
        this.stderr = details.stderr;
    }
}

function runSnarkjs(args, { cwd } = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn("snarkjs", args, {
            cwd,
            stdio: ["ignore", "pipe", "pipe"]
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        child.on("error", (error) => {
            reject(new SnarkjsExecutionError(`Failed to launch snarkjs: ${error.message}`, {
                code: "SNARKJS_LAUNCH_FAILED",
                exitCode: null,
                stdout,
                stderr
            }));
        });

        child.on("close", (exitCode) => {
            if (exitCode === 0) {
                resolve({ stdout, stderr, exitCode });
                return;
            }

            reject(new SnarkjsExecutionError("snarkjs command failed", {
                code: "SNARKJS_COMMAND_FAILED",
                exitCode,
                stdout,
                stderr
            }));
        });
    });
}

async function runGroth16Prove({ zkeyPath, witnessPath, proofPath, publicPath, cwd }) {
    return runSnarkjs(["groth16", "prove", zkeyPath, witnessPath, proofPath, publicPath], { cwd });
}

async function runGroth16Verify({ verificationKeyPath, publicPath, proofPath, cwd }) {
    try {
        const result = await runSnarkjs(["groth16", "verify", verificationKeyPath, publicPath, proofPath], { cwd });
        const combinedOutput = `${result.stdout}\n${result.stderr}`;

        return {
            verified: combinedOutput.includes("OK!"),
            stdout: result.stdout,
            stderr: result.stderr
        };
    } catch (error) {
        const combinedOutput = `${error.stdout || ""}\n${error.stderr || ""}`;

        if (combinedOutput.includes("Invalid proof")) {
            return {
                verified: false,
                stdout: error.stdout || "",
                stderr: error.stderr || ""
            };
        }

        throw error;
    }
}

module.exports = {
    SnarkjsExecutionError,
    runGroth16Prove,
    runGroth16Verify
};
