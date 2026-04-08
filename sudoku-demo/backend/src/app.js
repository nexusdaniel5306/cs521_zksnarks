const express = require("express");
const { createHealthRouter } = require("./routes/health");
const { createProofJobsRouter } = require("./routes/proofJobs");

function createApp({ artifactRegistry, jobStore, proofQueue }) {
    const app = express();

    app.use(express.json({ limit: "1mb" }));

    app.use("/api/v1/health", createHealthRouter({ artifactRegistry, proofQueue }));
    app.use("/api/v1/proof-jobs", createProofJobsRouter({ jobStore, proofQueue }));

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
