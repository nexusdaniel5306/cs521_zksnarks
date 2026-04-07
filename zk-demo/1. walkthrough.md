````markdown
# zk-SNARK Beginner Demo: Step-by-Step Explanation

This guide explains what is happening at each step of a simple zk-SNARK workflow using a basic circuit that proves knowledge of a value `x` such that `x² = y`.

The goal is to understand *what each step means*, not just how to run the commands.

---

## Step 2 — Define the Circuit

```circom
pragma circom 2.0.0;

template Square() {
    signal input x;
    signal input y;
    signal output out;

    out <== x * x;
    out === y;
}
````

### What this means

This is where we define the *statement we want to prove*.

The claim is:

> “I know a value `x` such that `x² = y`.”

Instead of writing a normal program, we express this as **mathematical constraints**.

### Key idea: Programs become equations

* `out <== x * x`
  This computes an intermediate value: `out = x²`

* `out === y`
  This enforces that the computed value must equal `y`

Together, these form a constraint:

```
x² = y
```

This is the core idea behind zk-SNARKs:

* You are not writing a program to *run*
* You are defining equations that must be *satisfied*

---

## Step 3 — Compile the Circuit

```bash
circom square.circom --r1cs --wasm --sym
```

### What this means

You are transforming your high-level circuit into lower-level representations that the proving system can use.

This produces several outputs:

#### 1. R1CS (Rank-1 Constraint System)

* A formal system of equations
* This is the mathematical version of your program
* The prover must satisfy all these constraints

#### 2. WASM file

* A program used to compute the *witness*
* It executes the circuit logic with actual inputs

#### 3. Symbols file

* Debugging information
* Not essential for understanding the proof process

### Conceptual takeaway

This step converts:

```
Program → Mathematical constraints
```

---

## Step 4 — Provide Inputs

```json
{
  "x": 3,
  "y": 9
}
```

### What this means

You are defining:

* `x` as a **private input** (the secret)
* `y` as a **public input** (what others can see)

You are claiming:

> “I know a value `x` such that x² = 9.”

---

## Step 5 — Generate the Witness

```bash
node square_js/generate_witness.js square_js/square.wasm input.json witness.wtns
```

### What is a witness?

The **witness** is all values that make the circuit true.

In this example, it includes:

* `x = 3`
* `out = 9`

### What is happening

1. The system takes your inputs
2. It runs the circuit logic
3. It computes all intermediate values
4. It produces a full assignment that satisfies the constraints

### Key idea

The witness is:

* The *evidence* that your claim is true
* Kept private and never revealed

---

## Step 6 — Trusted Setup (Groth16)

```bash
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="first" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
```

### What this means

This step generates cryptographic parameters required for proof generation and verification.

These parameters include structured randomness that the system relies on.

### Why it exists

Some zk-SNARK systems (like Groth16) require a setup phase to:

* Enable efficient proofs
* Ensure correctness of verification

### Important concept

If the randomness from this step is not handled properly, it could compromise security.

In real-world systems, this is handled through multi-party ceremonies to reduce trust assumptions.

---

## Step 7 — Circuit-Specific Setup

```bash
snarkjs groth16 setup square.r1cs pot12_final.ptau square_0000.zkey
snarkjs zkey contribute square_0000.zkey square_final.zkey --name="1st"
snarkjs zkey export verificationkey square_final.zkey verification_key.json
```

### What this means

This step specializes the setup for your specific circuit.

It produces two important keys:

#### Proving key

* Used to generate proofs
* Held by the prover

#### Verification key

* Used to verify proofs
* Can be shared publicly

### Conceptual takeaway

You are combining:

* General cryptographic setup
* Your specific constraint system

Result:

* Keys tailored to proving the statement `x² = y`

---

## Step 8 — Generate the Proof

```bash
snarkjs groth16 prove square_final.zkey witness.wtns proof.json public.json
```

### What this means

You are generating a cryptographic proof that:

> “I know a valid witness that satisfies all constraints.”

### What makes this special

The proof:

* Is very small
* Does not reveal the witness (`x`)
* Still convinces others the statement is true

### What is being proven

* You know `x`
* Such that `x² = y`
* Without revealing `x`

---

## Step 9 — Verify the Proof

```bash
snarkjs groth16 verify verification_key.json public.json proof.json
```

### What this means

The verifier checks:

* The proof
* The public input (`y`)
* The verification key

### Result

If valid:

```
OK!
```

### Interpretation

This means:

> “Someone knows a value `x` such that x² = y.”

But the verifier does not learn what `x` is.

---

## Step 10 — Sanity Test (Failure Case)

```json
{
  "x": 4,
  "y": 9
}
```

### What this means

Now the claim is false:

```
4² = 16 ≠ 9
```

### What happens

* Witness generation still runs
* Proof generation still runs
* Verification fails

### Key takeaway

The system enforces correctness:

* If constraints are not satisfied, the proof will not verify
* It is not possible to produce a valid proof for a false statement

---

## Summary

This pipeline demonstrates the core flow of zk-SNARKs:

1. Define constraints (the circuit)
2. Compile into mathematical form
3. Generate a witness (private evidence)
4. Create a proof (compressed evidence)
5. Verify the proof using only public data

The verifier becomes convinced that a statement is true, without learning the underlying secret.

```
```
