// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as psList from 'ps-list';
import * as os from 'os';
import * as which from 'which'
import * as fs from 'fs'
import { Process } from '../util/process';

export interface ProcessInfo {
    cmd: string;
    name: string;
    pid: number;
}

export interface ProcessProvider {
    listProcesses(name: string, daprdPath: string): Promise<ProcessInfo[]>;
}

export class UnixProcessProvider implements ProcessProvider {
    async listProcesses(name: string, daprdPath: string): Promise<ProcessInfo[]> {
        const processes = await psList();
        return processes
            .filter(process => process.name === name || this.hasDaprdPath(process, daprdPath))
            .map(process => ({ name: process.name, cmd: process.cmd ?? '', pid: process.pid }));
    }

    hasDaprdPath(process: psList.ProcessDescriptor, daprdPath: string): boolean | undefined {
        const daprd = which.sync('daprd', {nothrow: true});
        if(daprd !== null) { //check if daprd is in PATH env
            return process.cmd?.startsWith(daprd); 
        } else if (daprd === null && daprdPath !== "daprd") { //if not in PATH, check if config path provided
            return process.cmd?.startsWith(daprdPath)
        } else { //if not in PATH and no config path, check if filepath is daprd executable
            const daprdEndPoint = "/daprd ";
            const endpoint = process.cmd?.indexOf(daprdEndPoint);
            if(endpoint !== undefined && endpoint !== -1) {
                const executable = process.cmd?.substring(0, endpoint + daprdEndPoint.length - 1)
                if(executable !== undefined) {
                    try {
                        fs.accessSync(executable, fs.constants.X_OK);
                        return process.cmd?.startsWith(executable);
                    } catch(ex) {
                        return;
                    }
                }
            }
        }
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