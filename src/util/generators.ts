// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export function* range(start = 0): Generator<number, void, unknown> {
    while (true) {
        yield start++;
    }
}

export function* names(prefix: string, rangeGenerator: Generator<number, void, unknown>): Generator<string, void, unknown> {
    let index = rangeGenerator.next();

    while (!index.done) {
        yield `${prefix}${index.value}`;

        index = rangeGenerator.next();
    }
}
