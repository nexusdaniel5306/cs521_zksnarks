class QueueFullError extends Error {
    constructor(message) {
        super(message);
        this.name = "QueueFullError";
        this.code = "QUEUE_FULL";
    }
}

class ProofQueue {
    constructor({ maxQueueLength, runJob }) {
        this.maxQueueLength = maxQueueLength;
        this.runJob = runJob;
        this.pending = [];
        this.active = false;
    }

    enqueue(jobId, payload) {
        if (this.pending.length >= this.maxQueueLength) {
            throw new QueueFullError("Proof queue is full");
        }

        this.pending.push({ jobId, payload });
        this.processNext().catch(() => {});
    }

    size() {
        return this.pending.length + (this.active ? 1 : 0);
    }

    async processNext() {
        if (this.active) {
            return;
        }

        const next = this.pending.shift();
        if (!next) {
            return;
        }

        this.active = true;

        try {
            await this.runJob(next.jobId, next.payload);
        } finally {
            this.active = false;
            if (this.pending.length > 0) {
                await this.processNext();
            }
        }
    }
}

module.exports = {
    ProofQueue,
    QueueFullError
};
