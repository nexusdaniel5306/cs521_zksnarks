pragma circom 2.1.6;

template AssertNotEqual() {
    signal input a;
    signal input b;

    signal diff;
    signal inv;

    diff <== a - b;
    inv <-- diff != 0 ? 1 / diff : 0;
    diff * inv === 1;
}

template AssertAllDistinct9() {
    signal input values[9];

    component neq[36];
    var idx = 0;

    for (var i = 0; i < 9; i++) {
        for (var j = i + 1; j < 9; j++) {
            neq[idx] = AssertNotEqual();
            neq[idx].a <== values[i];
            neq[idx].b <== values[j];
            idx++;
        }
    }
}
