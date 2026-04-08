const { v4: uuidv4 } = require("uuid");
const { JOB_STAGE, JOB_STATUS, STAGE_PROGRESS } = require("../types/jobShapes");

class JobStore {
    constructor({ jobTtlMs, cleanupIntervalMs }) {
        this.jobTtlMs = jobTtlMs;
        this.jobs = new Map();
        this.cleanupInterval = null;

        if (cleanupIntervalMs > 0) {
            this.cleanupInterval = setInterval(() => {
                this.cleanupExpiredJobs();
            }, cleanupIntervalMs);

            this.cleanupInterval.unref();
        }
    }

    createJob(payload) {
        const jobId = uuidv4();
        const createdAt = new Date().toISOString();
        const job = {
            jobId,
            status: JOB_STATUS.QUEUED,
            stage: JOB_STAGE.QUEUED,
            progressPercent: STAGE_PROGRESS[JOB_STAGE.QUEUED],
            message: "Job queued",
            createdAt,
            startedAt: null,
            finishedAt: null,
            timingsMs: {},
            result: null,
            error: null,
            payload,
            currentStageStartedAtMs: null
        };

        this.jobs.set(jobId, job);
        return job;
    }

    getJob(jobId) {
        return this.jobs.get(jobId) || null;
    }

    updateJob(jobId, updates) {
        const existing = this.getJob(jobId);
        if (!existing) {
            return null;
        }

        const updated = {
            ...existing,
            ...updates
        };

        this.jobs.set(jobId, updated);
        return updated;
    }

    deleteJob(jobId) {
        this.jobs.delete(jobId);
    }

    cleanupExpiredJobs(referenceTimeMs = Date.now()) {
        for (const [jobId, job] of this.jobs.entries()) {
            if (!job.finishedAt) {
                continue;
            }

            const finishedAtMs = Date.parse(job.finishedAt);
            if (Number.isNaN(finishedAtMs)) {
                continue;
            }

            if (referenceTimeMs - finishedAtMs >= this.jobTtlMs) {
                this.jobs.delete(jobId);
            }
        }
    }

    dispose() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

module.exports = {
    JobStore
};
