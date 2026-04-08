## Backend Overview

At a high level, the backend accepts:

- a public 9x9 Sudoku puzzle
- a private 9x9 completed solution

It then runs the proving pipeline server-side:

1. validate the submitted board data
2. convert the puzzle and solution into circuit input
3. generate a witness from the Circom circuit
4. generate a Groth16 proof with `snarkjs`
5. verify that proof before returning the result

What the frontend should recieve:

- an immediate proof job id
- a polling endpoint for live progress
- stage-level updates that can drive status UI
- a final verification result
- the raw proof and public signals for optional inspection

In practice, the frontend submits the Sudoku data, polls for progress, and renders the backend stages as the zk proving/validation pipeline advances.

## Project Context

This app demonstrates a zero-knowledge proof workflow using Sudoku as the example statement.

The user provides:

- a public 9x9 Sudoku puzzle
- a private 9x9 completed solution

The backend then proves that the submitted solution:

- contains valid Sudoku digits
- matches all public clues in the puzzle
- satisfies row uniqueness
- satisfies column uniqueness
- satisfies 3x3 box uniqueness

The proof verifies without revealing the solved board in the proof output.

## Important Product Note

In the current backend version, the server does receive the full solved board.

That means:

- this is a backend-hosted proving demo
- the proof output is zero-knowledge
- the transport model is not private from the backend itself

For the frontend, that means:

- the UI can send both puzzle and solution to the backend
- the UI should let the user enter or otherwise obtain a full solution before submission
- the final proof-result view should avoid revealing the completed solution by default unless that is a deliberate product choice

## Backend Location

Main project root:

- [`sudoku-demo/`](./README.md)

Relevant backend files:

- API routes: [`backend/src/routes/proofJobs.js`](./backend/src/routes/proofJobs.js)
- Health route: [`backend/src/routes/health.js`](./backend/src/routes/health.js)
- Job stages: [`backend/src/types/jobShapes.js`](./backend/src/types/jobShapes.js)
- Input validation: [`backend/src/lib/sudokuValidation.js`](./backend/src/lib/sudokuValidation.js)
- Proof execution: [`backend/src/services/proofRunner.js`](./backend/src/services/proofRunner.js)

## Backend Setup and Startup

The backend must be running before integrating against the API.

### Prerequisites

The local machine needs:

- Node.js 20+
- `npm`
- `circom`
- `snarkjs`

### First-Time Setup

From [`backend/`](./backend/):

```bash
cd backend
npm install
npm run build:circuit
```

What this does:

- installs the backend dependencies
- compiles the Sudoku Circom circuit
- generates the proving artifacts under [`artifacts/`](./artifacts/)

### Start the Backend

From [`backend/`](./backend/):

```bash
npm start
```

Default local bind:

```text
http://127.0.0.1:3000
```

Useful first check:

```bash
curl http://127.0.0.1:3000/api/v1/health
```

Expected healthy response:

```json
{
  "status": "ok",
  "artifactsReady": true,
  "queueDepth": 0,
  "missingArtifacts": []
}
```

### Dev Notes

- The backend fails fast at startup if proving artifacts are missing.
- If `npm start` exits immediately, the first thing to check is whether `npm run build:circuit` completed successfully.
- Jobs are stored in memory only, so restarting the backend clears all outstanding job state.
- There is no CORS configuration yet, so same-origin dev is easiest until that is added.

## API Base

Base path:

```text
/api/v1
```

Endpoints:

- `GET /api/v1/health`
- `POST /api/v1/proof-jobs`
- `GET /api/v1/proof-jobs/:jobId`

## Expected Frontend Flow

1. User enters or loads a Sudoku puzzle.
2. User fills in a complete solution or imports one from another part of the app.
3. Frontend sends both `puzzle` and `solution` to `POST /api/v1/proof-jobs`.
4. Backend returns a `jobId` immediately.
5. Frontend polls `GET /api/v1/proof-jobs/:jobId`.
6. UI updates progress based on `status`, `stage`, `progressPercent`, and `message`.
7. When finished:
   - if `status === "COMPLETED"`, show proof success and verification result
   - if `status === "FAILED"`, show the backend error message

## Payload Format

The backend expects both `puzzle` and `solution` as `9 x 9` arrays of integers.

### Request: `POST /api/v1/proof-jobs`

```json
{
  "puzzle": [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ],
  "solution": [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
  ]
}
```

### Validation Rules

- `puzzle` is required
- `solution` is required
- both must be `9 x 9` arrays
- every value must be an integer
- `puzzle` values must be between `0` and `9`
- `solution` values must be between `1` and `9`

Interpretation:

- `0` in the puzzle means an empty clue
- `solution` cannot contain `0`

## Response Shapes

### `GET /api/v1/health`

Purpose:

- basic readiness check
- useful for dev boot flow
- useful for showing “backend not ready” if artifacts are missing

Example:

```json
{
  "status": "ok",
  "artifactsReady": true,
  "queueDepth": 0,
  "missingArtifacts": []
}
```

### Success: `POST /api/v1/proof-jobs`

Returns immediately with `202 Accepted`.

```json
{
  "jobId": "f6a0c2d0-ec46-4e42-a2f5-76f47b867dc1",
  "status": "QUEUED",
  "stage": "QUEUED",
  "progressPercent": 0,
  "createdAt": "2026-04-08T21:15:12.123Z",
  "pollUrl": "/api/v1/proof-jobs/f6a0c2d0-ec46-4e42-a2f5-76f47b867dc1"
}
```

### In-Progress: `GET /api/v1/proof-jobs/:jobId`

```json
{
  "jobId": "f6a0c2d0-ec46-4e42-a2f5-76f47b867dc1",
  "status": "RUNNING",
  "stage": "GENERATING_WITNESS",
  "progressPercent": 45,
  "message": "Generating witness from Sudoku circuit input",
  "createdAt": "2026-04-08T21:15:12.123Z",
  "startedAt": "2026-04-08T21:15:12.130Z",
  "finishedAt": null,
  "timingsMs": {
    "VALIDATING_INPUT": 2,
    "PREPARING_CIRCUIT_INPUT": 1
  },
  "result": null,
  "error": null
}
```

### Completed: `GET /api/v1/proof-jobs/:jobId`

```json
{
  "jobId": "f6a0c2d0-ec46-4e42-a2f5-76f47b867dc1",
  "status": "COMPLETED",
  "stage": "COMPLETED",
  "progressPercent": 100,
  "message": "Proof generated and verified",
  "createdAt": "2026-04-08T21:15:12.123Z",
  "startedAt": "2026-04-08T21:15:12.130Z",
  "finishedAt": "2026-04-08T21:15:13.287Z",
  "timingsMs": {
    "VALIDATING_INPUT": 2,
    "PREPARING_CIRCUIT_INPUT": 1,
    "GENERATING_WITNESS": 180,
    "GENERATING_PROOF": 920,
    "VERIFYING_PROOF": 38
  },
  "result": {
    "verified": true,
    "proof": {
      "pi_a": [],
      "pi_b": [],
      "pi_c": [],
      "protocol": "groth16",
      "curve": "bn128"
    },
    "publicSignals": []
  },
  "error": null
}
```

Notes:

- `proof` is the raw Groth16 proof object
- `publicSignals` is the raw array returned by `snarkjs`
- the frontend does not need to interpret these deeply unless you want a proof-inspection panel

### Failed: `GET /api/v1/proof-jobs/:jobId`

```json
{
  "jobId": "f6a0c2d0-ec46-4e42-a2f5-76f47b867dc1",
  "status": "FAILED",
  "stage": "GENERATING_WITNESS",
  "progressPercent": 45,
  "message": "Proof job failed",
  "createdAt": "2026-04-08T21:15:12.123Z",
  "startedAt": "2026-04-08T21:15:12.130Z",
  "finishedAt": "2026-04-08T21:15:12.631Z",
  "timingsMs": {
    "VALIDATING_INPUT": 2,
    "PREPARING_CIRCUIT_INPUT": 1,
    "GENERATING_WITNESS": 498
  },
  "result": null,
  "error": {
    "code": "PROOF_JOB_FAILED",
    "message": "Assert Failed."
  }
}
```

## Job Statuses

Top-level `status` values:

- `QUEUED`
- `RUNNING`
- `COMPLETED`
- `FAILED`

Frontend recommendation:

- use `status` for broad state
- use `stage` for progress UI and user-facing detail

## Job Stages

Current backend stages:

- `QUEUED`
- `VALIDATING_INPUT`
- `PREPARING_CIRCUIT_INPUT`
- `GENERATING_WITNESS`
- `GENERATING_PROOF`
- `VERIFYING_PROOF`
- `COMPLETED`
- `FAILED`

Current progress mapping:

- `QUEUED` -> `0`
- `VALIDATING_INPUT` -> `10`
- `PREPARING_CIRCUIT_INPUT` -> `20`
- `GENERATING_WITNESS` -> `45`
- `GENERATING_PROOF` -> `75`
- `VERIFYING_PROOF` -> `90`
- `COMPLETED` -> `100`

## Recommended UI Copy by Stage

Suggested frontend labels:

- `QUEUED`: “Queued for proving”
- `VALIDATING_INPUT`: “Validating Sudoku input”
- `PREPARING_CIRCUIT_INPUT`: “Formatting circuit input”
- `GENERATING_WITNESS`: “Generating witness”
- `GENERATING_PROOF`: “Generating zk proof”
- `VERIFYING_PROOF`: “Verifying proof”
- `COMPLETED`: “Proof verified”
- `FAILED`: “Proof failed”

## Polling Guidance

Recommended polling interval:

- `500ms` to `1500ms`

Suggested behavior:

- start polling immediately after `POST /proof-jobs`
- stop polling when `status` becomes `COMPLETED` or `FAILED`
- show `message` from the backend directly where useful

## Error Handling

### `400 Bad Request`

Returned when the request payload is malformed.

Example:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "solution[3][2] must be between 1 and 9"
  }
}
```

Treat this as a user-fixable input error.

### `404 Not Found`

Returned when the frontend polls a nonexistent or expired job id.

Example:

```json
{
  "error": {
    "code": "JOB_NOT_FOUND",
    "message": "No proof job found for id ..."
  }
}
```

Treat this as a missing or expired job state and stop polling.

### `503 Service Unavailable`

Returned when the proving queue is full.

Example:

```json
{
  "error": {
    "code": "QUEUE_FULL",
    "message": "Proof queue is full"
  }
}
```

Treat this as a retryable backend-capacity error.

## UX Recommendations

- Keep the Sudoku board input separate from the proof result panel.
- Do not reveal the completed solution in the final success state by default.
- Use the backend `stage` and `progressPercent` to animate a timeline or stepper.
- Show elapsed timings if you want the internal zk pipeline to feel visible.
- Consider a “technical details” drawer for:
  - `jobId`
  - `stage`
  - `timingsMs`
  - `proof`
  - `publicSignals`

## Current Backend Constraints

- No auth
- No persistent database
- Jobs are stored in memory only
- Completed jobs expire after roughly one hour
- No SSE or WebSocket streaming
- Polling is the intended integration model
- No CORS layer is currently configured in the backend

If frontend and backend run on different origins, CORS support will need to be added.

## Suggested Frontend Types

```ts
type SudokuGrid = number[][];

type ProofJobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

type ProofJobStage =
  | "QUEUED"
  | "VALIDATING_INPUT"
  | "PREPARING_CIRCUIT_INPUT"
  | "GENERATING_WITNESS"
  | "GENERATING_PROOF"
  | "VERIFYING_PROOF"
  | "COMPLETED"
  | "FAILED";

type CreateProofJobRequest = {
  puzzle: SudokuGrid;
  solution: SudokuGrid;
};

type CreateProofJobResponse = {
  jobId: string;
  status: "QUEUED";
  stage: "QUEUED";
  progressPercent: number;
  createdAt: string;
  pollUrl: string;
};

type ProofJobResponse = {
  jobId: string;
  status: ProofJobStatus;
  stage: ProofJobStage;
  progressPercent: number;
  message: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  timingsMs: Record<string, number>;
  result: null | {
    verified: boolean;
    proof: Record<string, unknown>;
    publicSignals: unknown[];
  };
  error: null | {
    code: string;
    message: string;
  };
};
```

## Example Frontend Integration Pattern

```ts
const createResponse = await fetch("/api/v1/proof-jobs", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ puzzle, solution })
});

const created = await createResponse.json();

const poll = async () => {
  const response = await fetch(created.pollUrl);
  const job = await response.json();

  setProofJob(job);

  if (job.status === "COMPLETED" || job.status === "FAILED") {
    return;
  }

  window.setTimeout(poll, 1000);
};

poll();
```

## Sample Inputs

The backend already includes example data:

- [`examples/puzzle-valid.json`](./examples/puzzle-valid.json)
- [`examples/solution-valid.json`](./examples/solution-valid.json)

Those are suitable as initial seed data for frontend development.
