// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as psList from 'ps-list';
import * as os from 'os';
import { Process } from '../util/process';

export interface ProcessInfo {
    cmd: string;
    name: string;
    pid: number;
}

export interface ProcessProvider {
    listProcesses(name: string): Promise<ProcessInfo[]>;
}

export class UnixProcessProvider implements ProcessProvider {
    async listProcesses(name: string): Promise<ProcessInfo[]> {
        const processes = await psList();

        return processes
            .filter(process => process.name === name)
            .map(process => ({ name: process.name, cmd: process.cmd ?? '', pid: process.pid }));
    }
}

function getWmicValue(line: string): string {
    const index = line.indexOf('=');

    return line.substring(index + 1);
}

export class WindowsProcessProvider implements ProcessProvider {
    async listProcesses(name: string): Promise<ProcessInfo[]> {
        const list = await Process.exec(`wmic process where "name='${name}.exe'" get commandline,name,processid /format:list`);
        
        // Lines in the output are delimited by "<CR><CR><LF>".
        const lines = list.stdout.split('\r\r\n');

        const processes: ProcessInfo[] = [];

        // Each item in the list is prefixed by two empty lines, then <property>=<value> lines, in alphabetical order.
        for (let i = 0; i < lines.length / 5; i++) {
            const obj = {};

            // Stop if the input is truncated (as there is an upper output limit)...
            if ((i * 5) + 4 >= lines.length) {
                break;
            }

            const cmd = getWmicValue(lines[(i * 5) + 2]);
            const name = getWmicValue(lines[(i * 5) + 3]);
            const pid = parseInt(getWmicValue(lines[(i * 5) + 4]), 10);

            processes.push({ cmd, name, pid });
        }

        return processes;
    }
}

export default function createPlatformProcessProvider(): ProcessProvider {
    if (os.platform() === 'win32') {
        return new WindowsProcessProvider();
    } else {
        return new UnixProcessProvider();
    }
}