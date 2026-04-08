const express = require("express");

function createHealthRouter({ artifactRegistry, proofQueue }) {
    const router = express.Router();

    router.get("/", (_req, res) => {
        const validation = artifactRegistry.validateArtifacts();

        res.json({
            status: "ok",
            artifactsReady: validation.ready,
            queueDepth: proofQueue.size(),
            missingArtifacts: validation.missing
        });
    });

    return router;
}

module.exports = {
    createHealthRouter
};
