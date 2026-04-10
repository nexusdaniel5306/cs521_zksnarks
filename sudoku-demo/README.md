# Sudoku zk-SNARK Demo

This project extends the existing square proof example into a backend-first Sudoku proving pipeline using Circom and `snarkjs`.

## What it proves

The prover submits:

- a public 9x9 Sudoku puzzle
- a private 9x9 completed solution

The circuit proves that the submitted solution:

- uses digits in the allowed range
- preserves all public clues
- satisfies Sudoku row, column, and 3x3 box uniqueness constraints

The generated proof verifies those claims without revealing the solution through the public proof output.

## Structure

- `circuits/`: Circom source for the Sudoku circuit
- `artifacts/`: generated circuit and proving artifacts
- `examples/`: sample valid puzzle and solution inputs
- `backend/`: Express API, proving queue, and tests

## Build the proving artifacts

From [`backend/package.json`](/sudoku-demo/backend/package.json):

```bash
npm run build:circuit
```

This compiles the circuit and creates the Groth16 proving and verification artifacts under [`artifacts/`](/sudoku-demo/artifacts).

## Start the backend

```bash
cd backend
npm install
npm start
```

The backend fails fast on startup if the required proving artifacts are missing.

## Web frontend

A static frontend now lives in `frontend/` and is served by the backend at the root URL.

After starting the backend, open:

```text
http://127.0.0.1:3000/
```

The UI supports:

- loading a random hardcoded Sudoku puzzle
- manually entering a solution
- auto-solving for demo purposes
- submitting to the backend proof-job API
- polling and showing proof verification progress/stage
- displaying success without exposing the solved board in the result panel

## Main API

- `GET /api/v1/health`
- `POST /api/v1/proof-jobs`
- `GET /api/v1/proof-jobs/:jobId`

`POST /api/v1/proof-jobs` returns a job id immediately. The frontend can poll the job endpoint to observe proving progress across each backend stage.
