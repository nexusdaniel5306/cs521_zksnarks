const express = require("express");
const { validateProofJobRequest } = require("../lib/sudokuValidation");
const { QueueFullError } = require("../services/proofQueue");

function serializeJob(job) {
    return {
        jobId: job.jobId,
        status: job.status,
        stage: job.stage,
        progressPercent: job.progressPercent,
        message: job.message,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        timingsMs: job.timingsMs,
        result: job.result,
        error: job.error
    };
}

function createProofJobsRouter({ jobStore, proofQueue }) {
    const router = express.Router();

    router.post("/", (req, res) => {
        const validation = validateProofJobRequest(req.body);
        if (!validation.ok) {
            res.status(400).json({
                error: {
                    code: "INVALID_REQUEST",
                    message: validation.error
                }
            });
            return;
        }

        const job = jobStore.createJob(req.body);

        try {
            proofQueue.enqueue(job.jobId, req.body);
        } catch (error) {
            if (error instanceof QueueFullError) {
                jobStore.deleteJob(job.jobId);
                res.status(503).json({
                    error: {
                        code: error.code,
                        message: error.message
                    }
                });
                return;
            }

            throw error;
        }

        res.status(202).json({
            jobId: job.jobId,
            status: job.status,
            stage: job.stage,
            progressPercent: job.progressPercent,
            createdAt: job.createdAt,
            pollUrl: `/api/v1/proof-jobs/${job.jobId}`
        });
    });

    router.get("/:jobId", (req, res) => {
        const job = jobStore.getJob(req.params.jobId);
        if (!job) {
            res.status(404).json({
                error: {
                    code: "JOB_NOT_FOUND",
                    message: `No proof job found for id ${req.params.jobId}`
                }
            });
            return;
        }

        res.json(serializeJob(job));
    });

    return router;
}

module.exports = {
    createProofJobsRouter,
    serializeJob
};
