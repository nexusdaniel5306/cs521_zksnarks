const express = require("express");
const fs = require("fs");
const path = require("path");
const { createHealthRouter } = require("./routes/health");
const { createProofJobsRouter } = require("./routes/proofJobs");

function createApp({ artifactRegistry, jobStore, proofQueue, frontendDir }) {
    const app = express();

    app.use(express.json({ limit: "1mb" }));

    app.use("/api/v1/health", createHealthRouter({ artifactRegistry, proofQueue }));
    app.use("/api/v1/proof-jobs", createProofJobsRouter({ jobStore, proofQueue }));

    if (frontendDir && fs.existsSync(frontendDir)) {
        app.use(express.static(frontendDir));
        app.get("/", (_req, res) => {
            res.sendFile(path.join(frontendDir, "index.html"));
        });
    }

    app.use((err, _req, res, _next) => {
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: err.message || "Unexpected server error"
            }
        });
    });

    return app;
}

module.exports = {
    createApp
};
