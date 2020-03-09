// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export class Lazy<T> {
    private _value: T | undefined;

    constructor(private readonly factory: () => T | undefined) {
    }

    get hasValue(): boolean {
        return this._value !== undefined;
    }

    get value(): T | undefined {
        if (this._value === undefined) {
            this._value = this.factory();
        }

        return this._value;
    }
}

export class AsyncLazy<T> {
    private _value: T | undefined;

    constructor(private readonly factory: () => Promise<T | undefined>) {
    }

    get hasValue(): boolean {
        return this._value !== undefined;
    }

    async getValue(): Promise<T | undefined> {
        if (this._value === undefined) {
            this._value = await this.factory();
        }

        return this._value;
    }
}
