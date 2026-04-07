pragma circom 2.0.0;

template Square() {
signal input x;
signal input y;
signal output out;

out <== x * x;
out === y;
}

component main = Square();
