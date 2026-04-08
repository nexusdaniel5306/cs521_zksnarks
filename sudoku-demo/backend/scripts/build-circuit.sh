#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${BACKEND_DIR}/.." && pwd)"
ARTIFACTS_DIR="${PROJECT_ROOT}/artifacts"
FINAL_ZKEY="${ARTIFACTS_DIR}/sudoku9x9_final.zkey"
VERIFY_KEY="${ARTIFACTS_DIR}/verification_key.json"

mkdir -p "${ARTIFACTS_DIR}"

if [[ -f "${FINAL_ZKEY}" && -f "${VERIFY_KEY}" && "${FORCE_REBUILD:-0}" != "1" ]]; then
    echo "Artifacts already exist at ${ARTIFACTS_DIR}. Set FORCE_REBUILD=1 to rebuild."
    exit 0
fi

cd "${PROJECT_ROOT}"

circom circuits/sudoku9x9.circom --r1cs --wasm --sym -o artifacts
snarkjs powersoftau new bn128 12 artifacts/pot12_0000.ptau
snarkjs powersoftau contribute artifacts/pot12_0000.ptau artifacts/pot12_0001.ptau --name="first" -e="sudoku-demo-initial-entropy"
snarkjs powersoftau prepare phase2 artifacts/pot12_0001.ptau artifacts/pot12_final.ptau
snarkjs groth16 setup artifacts/sudoku9x9.r1cs artifacts/pot12_final.ptau artifacts/sudoku9x9_0000.zkey
snarkjs zkey contribute artifacts/sudoku9x9_0000.zkey artifacts/sudoku9x9_final.zkey --name="1st" -e="sudoku-demo-zkey-entropy"
snarkjs zkey export verificationkey artifacts/sudoku9x9_final.zkey artifacts/verification_key.json
