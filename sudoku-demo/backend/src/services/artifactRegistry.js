const fs = require("fs");

class ArtifactRegistry {
    constructor(config) {
        this.config = config;
    }

    getPaths() {
        return this.config.artifactPaths;
    }

    validateArtifacts() {
        const paths = this.getPaths();
        const requiredEntries = [
            ["wasmPath", paths.wasmPath],
            ["generateWitnessPath", paths.generateWitnessPath],
            ["witnessCalculatorPath", paths.witnessCalculatorPath],
            ["zkeyPath", paths.zkeyPath],
            ["verificationKeyPath", paths.verificationKeyPath]
        ];

        const missing = requiredEntries
            .filter(([, targetPath]) => !fs.existsSync(targetPath))
            .map(([name, targetPath]) => ({ name, path: targetPath }));

        return {
            ready: missing.length === 0,
            missing
        };
    }

    assertReady() {
        const validation = this.validateArtifacts();

        if (!validation.ready) {
            const formatted = validation.missing
                .map((entry) => `${entry.name}: ${entry.path}`)
                .join(", ");

            throw new Error(`Missing required proving artifacts: ${formatted}`);
        }
    }
}

module.exports = {
    ArtifactRegistry
};
