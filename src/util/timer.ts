// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export default class Timer {
    static Timeout(delay: number): Promise<void> {
        return new Promise(
            (resolve) => {
                setTimeout(resolve, delay);
            });
    }
}