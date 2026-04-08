const { JOB_STAGE, JOB_STATUS, STAGE_PROGRESS } = require("../types/jobShapes");

class StageReporter {
    constructor(jobStore) {
        this.jobStore = jobStore;
    }

    setStage(jobId, stage, message) {
        const job = this.jobStore.getJob(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        const nowMs = Date.now();
        const nowIso = new Date(nowMs).toISOString();
        const timingsMs = { ...job.timingsMs };

        if (job.stage && job.currentStageStartedAtMs && ![JOB_STAGE.QUEUED, JOB_STAGE.COMPLETED, JOB_STAGE.FAILED].includes(job.stage)) {
            timingsMs[job.stage] = nowMs - job.currentStageStartedAtMs;
        }

        const updates = {
            status: stage === JOB_STAGE.QUEUED ? JOB_STATUS.QUEUED : JOB_STATUS.RUNNING,
            stage,
            message,
            progressPercent: STAGE_PROGRESS[stage],
            timingsMs,
            currentStageStartedAtMs: [JOB_STAGE.COMPLETED, JOB_STAGE.FAILED].includes(stage) ? null : nowMs
        };

        if (!job.startedAt && stage !== JOB_STAGE.QUEUED) {
            updates.startedAt = nowIso;
        }

        return this.jobStore.updateJob(jobId, updates);
    }

    complete(jobId, result, message = "Proof generated and verified") {
        const job = this.jobStore.getJob(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        const nowMs = Date.now();
        const timingsMs = { ...job.timingsMs };

        if (job.stage && job.currentStageStartedAtMs && ![JOB_STAGE.QUEUED, JOB_STAGE.COMPLETED, JOB_STAGE.FAILED].includes(job.stage)) {
            timingsMs[job.stage] = nowMs - job.currentStageStartedAtMs;
        }

        return this.jobStore.updateJob(jobId, {
            status: JOB_STATUS.COMPLETED,
            stage: JOB_STAGE.COMPLETED,
            progressPercent: STAGE_PROGRESS[JOB_STAGE.COMPLETED],
            message,
            finishedAt: new Date(nowMs).toISOString(),
            result,
            error: null,
            payload: null,
            timingsMs,
            currentStageStartedAtMs: null
        });
    }

    fail(jobId, error, message = "Proof job failed") {
        const job = this.jobStore.getJob(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        const nowMs = Date.now();
        const timingsMs = { ...job.timingsMs };

        if (job.stage && job.currentStageStartedAtMs && ![JOB_STAGE.QUEUED, JOB_STAGE.COMPLETED, JOB_STAGE.FAILED].includes(job.stage)) {
            timingsMs[job.stage] = nowMs - job.currentStageStartedAtMs;
        }

        return this.jobStore.updateJob(jobId, {
            status: JOB_STATUS.FAILED,
            stage: job.stage || JOB_STAGE.FAILED,
            progressPercent: STAGE_PROGRESS[job.stage] || STAGE_PROGRESS[JOB_STAGE.FAILED],
            message,
            finishedAt: new Date(nowMs).toISOString(),
            result: null,
            error,
            payload: null,
            timingsMs,
            currentStageStartedAtMs: null
        });
    }
}

module.exports = {
    StageReporter
};
