const fs = require("fs/promises");
const path = require("path");

async function createJobTempPaths(tempRoot, jobId) {
    const baseDir = await fs.mkdtemp(path.join(tempRoot, `sudoku-proof-${jobId}-`));

    return {
        dir: baseDir,
        inputPath: path.join(baseDir, "input.json"),
        witnessPath: path.join(baseDir, "witness.wtns"),
        proofPath: path.join(baseDir, "proof.json"),
        publicPath: path.join(baseDir, "public.json")
    };
}

async function cleanupJobTempPaths(tempPaths) {
    if (!tempPaths || !tempPaths.dir) {
        return;
    }

    await fs.rm(tempPaths.dir, { recursive: true, force: true });
}

module.exports = {
    createJobTempPaths,
    cleanupJobTempPaths
};
