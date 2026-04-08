pragma circom 2.1.6;

template AssertInRange0To9() {
    signal input in;

    signal products[9];

    products[0] <== in * (in - 1);

    for (var i = 2; i <= 9; i++) {
        products[i - 1] <== products[i - 2] * (in - i);
    }

    products[8] === 0;
}

template AssertInRange1To9() {
    signal input in;

    signal products[8];

    products[0] <== (in - 1) * (in - 2);

    for (var i = 3; i <= 9; i++) {
        products[i - 2] <== products[i - 3] * (in - i);
    }

    products[7] === 0;
}
