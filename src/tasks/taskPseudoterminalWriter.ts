// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export interface PseudoterminalWriter {
    write(output: string): void;
    writeLine(output: string): void;
}

const DEFAULT = '0m';

export default class TaskPseudoterminalWriter implements PseudoterminalWriter {
    constructor(private readonly callback: (output: string) => void) {
    }

    write(output: string): void {
        output = output.replace(/\r?\n/g, '\r\n'); // The carriage return (/r) is necessary or the pseudoterminal does not return back to the start of line
        this.callback(`\x1b[${DEFAULT}${output}\x1b[0m`);
    }

    writeLine(output: string): void {
        this.write(`${output}\r\n`); // The carriage return (/r) is necessary or the pseudoterminal does not return back to the start of line
    }
}